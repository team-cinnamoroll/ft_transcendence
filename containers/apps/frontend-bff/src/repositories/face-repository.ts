import 'server-only';

import type {
  CreateFaceRequest,
  UpdateFaceRequest,
  FaceSummary,
  FaceSummaryPage,
  Face,
  FaceList,
  FaceCreate,
  FaceUpdate,
  FaceSingleId,
} from '@/types/face';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';
import { classifyHttpStatus, type ApiResult } from '@/lib/api-error';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** フェイス作成時の入力型 */
export type CreateFaceInput = CreateFaceRequest;

/** フェイス更新時の入力型 */
export type UpdateFaceInput = UpdateFaceRequest;

/** FaceRepository が提供するメソッドの契約（Spec） */
export type FaceRepositorySpec = {
  /** 指定ユーザーのフェイス一覧を取得 */
  listByUserId: (accessToken: string, userId: string) => Promise<Face[]>;
  /** 指定ユーザーのフェイス一覧を1ページ分だけ取得(「もっと見る」用 */
  listPageByUserId: (
    accessToken: string,
    params: { userId: string; cursor?: string | null }
  ) => Promise<ApiResult<FaceSummaryPage>>;
  /** ID でフェイスを1件取得（存在しない場合は null） */
  findById: (accessToken: string, faceId: string) => Promise<Face | null>;
  /** フェイスを作成 */
  create: (accessToken: string, input: CreateFaceInput) => Promise<Face>;
  /** フェイスを更新 */
  update: (accessToken: string, faceId: string, input: UpdateFaceInput) => Promise<Face>;
  /** フェイスを削除 */
  delete: (accessToken: string, faceId: string) => Promise<void>;
  /** 全フェイス一覧を取得（検索用） */
  listAll: (accessToken: string) => Promise<Face[]>;
  /**
   * キーワード検索（q）でフェイスを取得。該当する全件をカーソルで辿って集める。
   * lastPostedAt/numberOfPosts はクライアント側でのソートに使うため、Faceに絞らずFaceSummaryのまま返す。
   */
  search: (accessToken: string, query: { q?: string; userId?: string }) => Promise<FaceSummary[]>;
};

// ─── バックエンドAPI実装 ────────────────────────────────────────

/**
 * GET /faces をカーソルで全ページ辿って集める。
 * listByUserId/listAll のように一覧全体が必要な場合に使う。
 * 単一IDでの取得(findById)は GET /faces/:faceId を1回呼ぶだけで完結する(#320)。
 */
async function fetchAllFaceSummaries(
  accessToken: string,
  query: { userId?: string; q?: string } = {}
): Promise<FaceSummary[]> {
  const all: FaceSummary[] = [];
  let cursor: string | undefined;

  for (;;) {
    const res = await createBackendClient(accessToken).api.v1.faces.$get({
      query: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.q ? { q: query.q } : {}),
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

    listPageByUserId: async (accessToken, { userId, cursor }) => {
      const res = await createBackendClient(accessToken).api.v1.faces.$get({
        query: { userId, ...(cursor ? { cursor } : {}) },
      });
      if (!res.ok) {
        console.error('FaceRepository.listPageByUserId: backend request failed', res.status);
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      const json = (await res.json()) as FaceList;
      if (!json.success) {
        return { success: false, errorKind: 'UNKNOWN' };
      }
      return { success: true, data: json.data.faces };
    },

    findById: async (accessToken, faceId) => {
      const res = await createBackendClient(accessToken).api.v1.faces[':faceId'].$get({
        param: { faceId },
      });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        console.error('FaceRepository: backend request failed', res.status);
        return null;
      }
      const json = (await res.json()) as FaceSingleId;
      if (!json.success) {
        return null;
      }
      return json.data.face;
    },

    create: async (accessToken, input) => {
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

    update: async (accessToken, faceId, input) => {
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
      return json.data.face;
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

    search: async (accessToken, query) => {
      return await fetchAllFaceSummaries(accessToken, query);
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
