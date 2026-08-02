import path from 'path';

// ==========================================
// 1. ファイルパス・設定定義 (変更可能)
// ==========================================
const MOCK_FILES = {
  users: '../../../frontend-bff/src/mocks/users',
  faces: '../../../frontend-bff/src/mocks/faces',
  seeds: '../../../frontend-bff/src/mocks/seeds',
};

// const BASE_URL = process.env.BASE_URL || 'http://localhost:8000/api/v1';
const BASE_URL = 'http://backend:8000/api/v1';
const DEFAULT_PASSWORD = 'password1234';

// ==========================================
// 型定義 & マッピング用インターフェース
// ==========================================
interface UserSession {
  originalId: string;
  newUserId: string;
  token: string;
  refreshToken: string;
}

// 画像の重複取得・アップロードを防ぐためのキャッシュ (URL -> fileId)
const imageCache = new Map<string, string>();

// ID マッピングテーブル (元ID -> 新API ID)
const userSessionMap = new Map<string, UserSession>();
const faceIdMap = new Map<string, string>();

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * URLから画像をダウンロードし、/file-storage/upload APIでアップロードして fileId を取得
 */
async function uploadImageFromUrl(url: string, token: string): Promise<string> {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  console.log(`  📥 画像を取得中: ${url}`);
  const imgRes = await fetch(url);
  if (!imgRes.ok) {
    throw new Error(`画像のダウンロードに失敗しました (${imgRes.status}): ${url}`);
  }

  const arrayBuffer = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
  const fileName = `seeded_image_${Date.now()}.${contentType.split('/')[1] || 'jpg'}`;

  console.log(`  📤 画像をアップロード中...`);
  const uploadRes = await fetch(`${BASE_URL}/file-storage/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-file-name': fileName,
      'x-file-type': contentType,
      'content-length': arrayBuffer.byteLength.toString(),
      'x-visibility': 'public',
    },
    body: arrayBuffer,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.success) {
    throw new Error(`画像のアップロードに失敗しました: ${JSON.stringify(uploadData)}`);
  }

  const fileId = uploadData.data.fileId;
  imageCache.set(url, fileId);
  return fileId;
}

// ==========================================
// メイン処理
// ==========================================
async function main() {
  console.log('🚀 モックデータのシード処理を開始します...\n');

  // モックファイルの動的インポート
  const usersPath = path.resolve(MOCK_FILES.users);
  const facesPath = path.resolve(MOCK_FILES.faces);
  const seedsPath = path.resolve(MOCK_FILES.seeds);

  const { users } = await import(usersPath);
  const { faces } = await import(facesPath);
  const { seeds } = await import(seedsPath);

  // ------------------------------------------
  // ステップ 1: ユーザー登録 & 画像アップロード
  // ------------------------------------------
  console.log('👤 [1/4] ユーザー登録処理中...');
  for (const user of users) {
    const email = `${user.id.toLowerCase()}@example.com`;

    // サインアップAPI呼出
    const signUpRes = await fetch(`${BASE_URL}/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: user.name,
        password: DEFAULT_PASSWORD,
      }),
    });

    const signUpData = await signUpRes.json();
    if (!signUpRes.ok || !signUpData.success) {
      console.error(`❌ ユーザー作成失敗 (${user.name}):`, signUpData);
      continue;
    }

    const token = signUpData.data.accessToken;
    const refreshToken = signUpData.data.refreshToken;
    const newUserId = signUpData.data.user.id;

    userSessionMap.set(user.id, {
      originalId: user.id,
      newUserId,
      token,
      refreshToken,
    });

    // ユーザーアバター画像のアップロード（存在する場合）
    if (user.avatar?.url) {
      try {
        await uploadImageFromUrl(user.avatar.url, token);
      } catch (err) {
        console.warn(`⚠️ アバター画像の処理をスキップしました:`, err);
      }
    }

    console.log(`  ✅ ユーザー作成完了: ${user.name} (ID: ${newUserId})`);
  }
  console.log('');

  // ------------------------------------------
  // ステップ 2: Face 登録
  // ------------------------------------------
  console.log('🎭 [2/4] Face 登録処理中...');
  for (const face of faces) {
    const session = userSessionMap.get(face.userId);
    if (!session) {
      console.warn(`⚠️ 対応するユーザーが見つからないためスキップ: ${face.name}`);
      continue;
    }

    // 画像のアップロード（urlが存在する場合、idは無視して新規アップロード）
    let imageId: string | null = null;
    if (face.image?.url) {
      try {
        imageId = await uploadImageFromUrl(face.image.url, session.token);
      } catch (err) {
        console.warn(`⚠️ Face画像の取得/アップロード失敗 (${face.name}):`, err);
      }
    }

    // Face 作成API呼出
    const faceRes = await fetch(`${BASE_URL}/faces`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: face.name,
        emoji: face.emoji || null,
        description: face.description || null,
        imageId,
        visibility: face.visibility || 'public',
      }),
    });

    const faceData = await faceRes.json();
    if (!faceRes.ok || !faceData.success) {
      console.error(`❌ Face作成失敗 (${face.name}):`, faceData);
      continue;
    }

    const newFaceId = faceData.data.face.id;
    faceIdMap.set(face.id, newFaceId);
    console.log(`  ✅ Face作成完了: ${face.name} (ID: ${newFaceId})`);
  }
  console.log('');

  // ------------------------------------------
  // ステップ 3: Seed 登録
  // ------------------------------------------
  console.log('🌱 [3/4] Seed 登録処理中...');
  for (const seed of seeds) {
    const session = userSessionMap.get(seed.userId);
    const newFaceId = faceIdMap.get(seed.faceId);

    if (!session || !newFaceId) {
      console.warn(`⚠️ 紐づくユーザーまたはFaceが見つからないためSeedスキップ: ID ${seed.id}`);
      continue;
    }

    // 画像のアップロード処理（複数対応）
    const imageIds: string[] = [];
    if (seed.images && seed.images.length > 0) {
      for (const img of seed.images) {
        if (img.url) {
          try {
            const uploadedFileId = await uploadImageFromUrl(img.url, session.token);
            imageIds.push(uploadedFileId);
          } catch (err) {
            console.warn(`⚠️ Seed画像の取得/アップロード失敗:`, err);
          }
        }
      }
    }

    // Seed 作成API呼出
    const seedRes = await fetch(`${BASE_URL}/seeds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        faceId: newFaceId,
        body: seed.body,
        imageIds,
      }),
    });

    const seedData = await seedRes.json();
    if (!seedRes.ok || !seedData.success) {
      console.error(`❌ Seed作成失敗:`, seedData);
      continue;
    }

    console.log(`  ✅ Seed作成完了 (FaceID: ${newFaceId})`);
  }
  console.log('');

  // ------------------------------------------
  // ステップ 4: 全ユーザーのログアウト
  // ------------------------------------------
  console.log('🚪 [4/4] ログアウト処理中...');
  for (const session of userSessionMap.values()) {
    try {
      const signOutRes = await fetch(`${BASE_URL}/auth/sign-out`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      });

      if (!signOutRes.ok) {
        console.warn(
          `⚠️ ログアウト失敗 (${session.originalId}): ステータスコード ${signOutRes.status}`
        );
      } else {
        console.log(`  ✅ ログアウト完了: ${session.originalId}`);
      }
    } catch (err) {
      console.warn(`⚠️ ログアウト処理エラー (${session.originalId}):`, err);
    }
  }

  console.log('\n🎉 すべてのシードデータ投入およびログアウト処理が完了しました！');
}

main().catch((err) => {
  console.error('💥 エラーが発生しました:', err);
  process.exit(1);
});
