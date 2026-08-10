import { getFaceRepository } from '../../src/features/post/face/infra/face.repository.di';
import { getSeedRepository } from '../../src/features/post/seed/infra/seed.repository.di';
import { getDatabaseUrl } from '../../src/shared/infra/db/database-url';
import { FaceEntitySchema } from '../../src/features/post/face/domain/face.entity';
import { SeedEntitySchema } from '../../src/features/post/seed/domain/seed.entity';
import { v4 as uuidv4 } from 'uuid';

import { users } from './data/users';
import { faces } from './data/faces';
import { seeds } from './data/seeds';
import { friendships } from './data/friendships';

// ==========================================
// 設定
// ==========================================
const BASE_URL = 'http://backend:8000/api/v1';
const DEFAULT_PASSWORD = 'password1234';
const API_KEY = process.env.MASTER_API_KEY || 'tracen_master_api_key'; // 適切なAPIキーに置き換えてください

const MOCK_PDF_CONTENT = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 62>>stream
BT /F1 24 Tf 20 100 Td (Mock PDF Document) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF
`;

// ==========================================
// 型定義 & マッピング用インターフェース
// ==========================================
interface UserSession {
  key: string;
  newUserId: string;
  token: string;
  refreshToken: string;
}

// 画像の重複取得・アップロードを防ぐためのキャッシュ (URL -> fileId)
const imageCache = new Map<string, string>();

// ID マッピングテーブル (key -> 実API ID)
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

/**
 * ダミーのPDFバイナリを /file-storage/upload APIでアップロードして fileId を取得(#349のPDF添付表示確認用)
 */
async function uploadMockPdf(token: string): Promise<string> {
  const buffer = Buffer.from(MOCK_PDF_CONTENT, 'utf-8');
  const fileName = `seeded_document_${Date.now()}.pdf`;

  const uploadRes = await fetch(`${BASE_URL}/file-storage/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-file-name': fileName,
      'x-file-type': 'application/pdf',
      'content-length': buffer.byteLength.toString(),
      'x-visibility': 'public',
    },
    body: buffer,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.success) {
    throw new Error(`PDFのアップロードに失敗しました: ${JSON.stringify(uploadData)}`);
  }

  return uploadData.data.fileId;
}

// ==========================================
// メイン処理
// ==========================================
async function main() {
  console.log('🚀 モックデータのシード処理を開始します...\n');

  const databaseUrl = getDatabaseUrl();
  const faceRepo = getFaceRepository(databaseUrl);
  const seedRepo = getSeedRepository(databaseUrl);

  // ------------------------------------------
  // ステップ 1: ユーザー登録 & アバター画像アップロード(HTTP API経由)
  // ------------------------------------------
  console.log('👤 [1/5] ユーザー登録処理中...');
  for (const user of users) {
    const email = `${user.key.toLowerCase()}@example.com`;

    const signUpRes = await fetch(`${BASE_URL}/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
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

    userSessionMap.set(user.key, { key: user.key, newUserId, token, refreshToken });

    if (user.avatarUrl) {
      try {
        const avatarFileId = await uploadImageFromUrl(user.avatarUrl, token);
        const profileRes = await fetch(`${BASE_URL}/user-profile/${newUserId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: user.name, avatarFileId, badge: null }),
        });
        if (!profileRes.ok) {
          console.warn(
            `⚠️ アバター設定に失敗しました (${user.name}): ステータスコード ${profileRes.status}`
          );
        }
      } catch (err) {
        console.warn(`⚠️ アバター画像の処理をスキップしました:`, err);
      }
    }

    console.log(`  ✅ ユーザー作成完了: ${user.name} (ID: ${newUserId})`);
  }
  console.log('');

  // ------------------------------------------
  // ステップ 2: フレンド関係構築(HTTP API経由)
  // ------------------------------------------
  console.log('🤝 [2/5] フレンド関係構築中...');
  for (const fs of friendships) {
    const requesterSession = userSessionMap.get(fs.requesterKey);
    const addresseeSession = userSessionMap.get(fs.addresseeKey);
    if (!requesterSession || !addresseeSession) {
      console.warn(
        `⚠️ 対応するユーザーが見つからないためスキップ: ${fs.requesterKey} -> ${fs.addresseeKey}`
      );
      continue;
    }

    const createRes = await fetch(`${BASE_URL}/friendships/requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${requesterSession.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addresseeId: addresseeSession.newUserId }),
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      console.error(`❌ フレンド申請失敗 (${fs.requesterKey} -> ${fs.addresseeKey}):`, createData);
      continue;
    }

    if (fs.accept) {
      const requestId = createData.data.friendship.id;
      const acceptRes = await fetch(`${BASE_URL}/friendships/requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${addresseeSession.token}` },
      });
      const acceptData = await acceptRes.json();
      if (!acceptRes.ok || !acceptData.success) {
        console.error(`❌ フレンド承認失敗 (${fs.addresseeKey}):`, acceptData);
        continue;
      }
    }

    console.log(
      `  ✅ フレンド関係作成完了: ${fs.requesterKey} -> ${fs.addresseeKey} (${fs.accept ? '承認済み' : '申請中'})`
    );
  }
  console.log('');

  // ------------------------------------------
  // ステップ 3: Face作成(repository層を直接呼び出し、createdAtは持たないためHTTPと同等)
  // ------------------------------------------
  console.log('🎭 [3/5] Face 登録処理中...');
  for (const face of faces) {
    const session = userSessionMap.get(face.userKey);
    if (!session) {
      console.warn(`⚠️ 対応するユーザーが見つからないためスキップ: ${face.name}`);
      continue;
    }

    let imageId: string | null = null;
    if (face.imageUrl) {
      try {
        imageId = await uploadImageFromUrl(face.imageUrl, session.token);
      } catch (err) {
        console.warn(`⚠️ Face画像の取得/アップロード失敗 (${face.name}):`, err);
      }
    }

    try {
      const faceId = uuidv4();
      const entity = FaceEntitySchema.parse({
        id: faceId,
        userId: session.newUserId,
        name: face.name,
        emoji: face.emoji,
        description: face.description,
        imageId,
        visibility: face.visibility,
      });
      await faceRepo.createFace(entity);
      faceIdMap.set(face.key, faceId);
      console.log(`  ✅ Face作成完了: ${face.name} (ID: ${faceId})`);
    } catch (err) {
      console.error(`❌ Face作成失敗 (${face.name}):`, err);
    }
  }
  console.log('');

  // ------------------------------------------
  // ステップ 4: Seed作成(repository層を直接呼び出し、createdAtを相対日付で指定)
  // ------------------------------------------
  console.log('🌱 [4/5] Seed 登録処理中...');
  let seedCount = 0;
  for (const seed of seeds) {
    const face = faces.find((f) => f.key === seed.faceKey);
    const newFaceId = faceIdMap.get(seed.faceKey);
    const session = face ? userSessionMap.get(face.userKey) : undefined;

    if (!face || !newFaceId || !session) {
      console.warn(`⚠️ 紐づくFaceまたはユーザーが見つからないためSeedスキップ: ${seed.faceKey}`);
      continue;
    }

    const imageIds: string[] = [];
    if (seed.attachments) {
      for (const attachment of seed.attachments) {
        try {
          if (attachment.kind === 'photo') {
            imageIds.push(await uploadImageFromUrl(attachment.url, session.token));
          } else {
            imageIds.push(await uploadMockPdf(session.token));
          }
        } catch (err) {
          console.warn(`⚠️ Seed添付ファイルの処理に失敗しました:`, err);
        }
      }
    }

    try {
      const entity = SeedEntitySchema.parse({
        id: uuidv4(),
        faceId: newFaceId,
        userId: session.newUserId,
        body: seed.body,
        imageIds,
        createdAt: seed.createdAt,
        updatedAt: seed.createdAt,
      });
      await seedRepo.createSeed(entity);
      seedCount++;
    } catch (err) {
      console.error(`❌ Seed作成失敗 (${seed.faceKey}):`, err);
    }
  }
  console.log(`  ✅ Seed作成完了: ${seedCount}件`);
  console.log('');

  // ------------------------------------------
  // ステップ 5: 全ユーザーのログアウト
  // ------------------------------------------
  console.log('🚪 [5/5] ログアウト処理中...');
  for (const session of userSessionMap.values()) {
    try {
      const signOutRes = await fetch(`${BASE_URL}/auth/sign-out`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (!signOutRes.ok) {
        console.warn(`⚠️ ログアウト失敗 (${session.key}): ステータスコード ${signOutRes.status}`);
      } else {
        console.log(`  ✅ ログアウト完了: ${session.key}`);
      }
    } catch (err) {
      console.warn(`⚠️ ログアウト処理エラー (${session.key}):`, err);
    }
  }

  console.log('\n🎉 すべてのシードデータ投入およびログアウト処理が完了しました！');
  console.log(
    'ℹ️  メールアドレスは決定論的なため、再実行する場合は先に `pnpm --filter backend db:reset` でDBをクリアしてください。'
  );
}

main().catch((err) => {
  console.error('💥 エラーが発生しました:', err);
  process.exit(1);
});
