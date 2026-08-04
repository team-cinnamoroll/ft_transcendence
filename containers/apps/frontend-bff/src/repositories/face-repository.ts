import 'server-only';

import type {
  CreateFaceRequest,
  UpdateFaceRequest,
  FaceSummary,
  Face,
  FaceList,
  FaceCreate,
  FaceUpdate,
} from '@/types/face';
import { faces } from '@/mocks/faces';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** フェイス作成時の入力型 */
export type CreateFaceInput = CreateFaceRequest;

/** フェイス更新時の入力型 */
export type UpdateFaceInput = UpdateFaceRequest;

/** FaceRepository が提供するメソッドの契約（Spec） */
export type FaceRepositorySpec = {
  /** 指定ユーザーのフェイス一覧を取得 */
  listByUserId: (accessToken: string, userId: string) => Promise<Face[]>;
  /** ID でフェイスを1件取得（存在しない場合は null） */
  findById: (accessToken: string, faceId: string) => Promise<Face | null>;
  /** フェイスを作成 */
  create: (accessToken: string, userId: string, input: CreateFaceInput) => Promise<Face>;
  /** フェイスを更新 */
  update: (
    accessToken: string,
    faceId: string,
    userId: string,
    input: UpdateFaceInput
  ) => Promise<Face>;
  /** フェイスを削除 */
  delete: (accessToken: string, faceId: string, userId: string) => Promise<void>;
  /** 全フェイス一覧を取得（検索用） */
  listAll: (accessToken: string) => Promise<Face[]>;
};

// ─── モック実装 ────────────────────────────────────────────────

export function createFaceMockRepositoryImpl(): FaceRepositorySpec {
  return {
    listByUserId: async (_accessToken, userId) => {
      return faces.filter((face) => face.userId === userId);
    },

    findById: async (_accessToken, faceId) => {
      return faces.find((face) => face.id === faceId) ?? null;
    },

    create: async (_accessToken, userId, input) => {
      // モック実装: ダミーの ID を付与して返却するだけ（実際には保存しない）
      const newFace: Face = {
        id: `face-mock-${Date.now()}`,
        userId,
        ...input,
        image: input.imageId
          ? { id: input.imageId, url: 'https://example.com/mock-image.jpg' }
          : null, // ダミーの画像URL
      };
      return newFace;
    },

    update: async (_accessToken, faceId, userId, input) => {
      // モック実装: 既存データとマージして返却するだけ（実際には保存しない）
      const existing = faces.find((f) => f.id === faceId && f.userId === userId);
      const updated: Face = {
        id: faceId,
        userId,
        ...(existing ?? {}),
        ...input,
        image: input.imageId
          ? { id: input.imageId, url: 'https://example.com/mock-image.jpg' }
          : null, // ダミーの画像URL
      };
      return updated;
    },

    delete: async () => {
      // モック実装: no-op（実際には削除しない）
      // 本番実装では、_faceId, _userIdの二つの引数を定義する
    },

    listAll: async () => {
      return faces;
    },
  };
}

export const faceMockRepositoryImpl: FaceRepositorySpec = createFaceMockRepositoryImpl();

// ─── バックエンドAPI実装 ────────────────────────────────────────

/**
 * GET /faces をカーソルで全ページ辿って集める。
 *
 * バックエンドには「単一IDで1件取得する」API(GET /faces/:faceId)が無く、
 * 一覧検索APIしか存在しないための暫定実装。
 * 単一取得APIが追加され次第、findById はこの全件走査をやめて置き換える想定(#320)。
 */
async function fetchAllFaceSummaries(
  accessToken: string,
  query: { userId?: string } = {}
): Promise<FaceSummary[]> {
  const all: FaceSummary[] = [];
  let cursor: string | undefined;

  for (;;) {
    const res = await createBackendClient(accessToken).api.v1.faces.$get({
      query: {
        ...(query.userId ? { userId: query.userId } : {}),
        limit: '100',
        ...(cursor ? { cursor } : {}),
      },
    });
    if (!res.ok) {
      console.error('FaceRepository: backend request failed', res.status);
      break;
    }
    const json = (await res.json()) as FaceList;
    if (!json.success) {
      break;
    }
    all.push(...json.data.faces.faceSummaries);
    if (!json.data.faces.nextCursor) {
      break;
    }
    cursor = json.data.faces.nextCursor;
  }

  return all;
}

export function createFaceApiRepositoryImpl(): FaceRepositorySpec {
  return {
    listByUserId: async (accessToken, userId) => {
      const summaries = await fetchAllFaceSummaries(accessToken, { userId });
      return summaries.map((summary) => summary.face);
    },

    findById: async (accessToken, faceId) => {
      // userId が分からない状態で呼ばれるため、userId 絞り込みは使えず全件走査になる(暫定実装、#320参照)
      const summaries = await fetchAllFaceSummaries(accessToken);
      const found = summaries.find((summary) => summary.face.id === faceId);
      return found ? found.face : null;
    },

    create: async (accessToken, _userId, input) => {
      const res = await createBackendClient(accessToken).api.v1.faces.$post({
        json: input,
      });
      if (!res.ok) {
        throw new Error(`FaceRepository.create: backend request failed (${res.status})`);
      }
      const json = (await res.json()) as FaceCreate;
      if (!json.success) {
        throw new Error(json.message ?? 'FaceRepository.create: backend returned failure');
      }
      return json.data.face;
    },

    update: async (accessToken, faceId, userId, input) => {
      const res = await createBackendClient(accessToken).api.v1.faces[':faceId'].$put({
        param: { faceId },
        json: input,
      });
      if (!res.ok) {
        throw new Error(`FaceRepository.update: backend request failed (${res.status})`);
      }
      const json = (await res.json()) as FaceUpdate;
      if (!json.success) {
        throw new Error(json.message ?? 'FaceRepository.update: backend returned failure');
      }
      // バックエンドの PUT レスポンスには更新後の本体が含まれないため、
      // 送信した input と faceId/userId から擬似的に Face を組み立てて返す(暫定実装)。
      // image は imageId から実際の url を取得する手段が無いため url は空文字にしている。
      // バックエンドがレスポンスに本体を含めるようになったら、json から取り出す実装に差し替える(#321)。
      return {
        id: faceId,
        userId,
        name: input.name,
        emoji: input.emoji,
        description: input.description,
        image: input.imageId ? { id: input.imageId, url: '' } : null,
        visibility: input.visibility,
      };
    },

    delete: async (accessToken, faceId) => {
      const res = await createBackendClient(accessToken).api.v1.faces[':faceId'].$delete({
        param: { faceId },
      });
      if (!res.ok) {
        throw new Error(`FaceRepository.delete: backend request failed (${res.status})`);
      }
    },

    listAll: async (accessToken) => {
      const summaries = await fetchAllFaceSummaries(accessToken);
      return summaries.map((summary) => summary.face);
    },
  };
}

export const faceApiRepositoryImpl: FaceRepositorySpec = createFaceApiRepositoryImpl();

/** Provider: DI の入口（実装の選択はここに閉じ込める） */
export const getFaceRepository = createSingletonProvider<FaceRepositorySpec>(
  () => faceApiRepositoryImpl
);

/** 互換用: 従来の import 口（Server 側でのみ使用する） */
export const faceRepository: FaceRepositorySpec = getFaceRepository();
