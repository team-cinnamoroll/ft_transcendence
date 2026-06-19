import 'server-only';

import { type CreateFaceRequest, type UpdateFaceRequest } from '@/types/face';
import { type Face } from '@/types/face';
import { faces } from '@/mocks/faces';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** フェイス作成時の入力型 */
export type CreateFaceInput = CreateFaceRequest;

/** フェイス更新時の入力型 */
export type UpdateFaceInput = UpdateFaceRequest;

/** FaceRepository が提供するメソッドの契約（Spec） */
export type FaceRepositorySpec = {
  /** 指定ユーザーのフェイス一覧を取得 */
  listByUserId: (userId: string) => Promise<Face[]>;
  /** ID でフェイスを1件取得（存在しない場合は null） */
  findById: (faceId: string) => Promise<Face | null>;
  /** フェイスを作成（モック実装はダミー返却） */
  create: (userId: string, input: CreateFaceInput) => Promise<Face>;
  /** フェイスを更新（モック実装はダミー返却） */
  update: (faceId: string, userId: string, input: UpdateFaceInput) => Promise<Face>;
  /** フェイスを削除（モック実装はno-op） */
  delete: (faceId: string, userId: string) => Promise<void>;
  /** 全フェイス一覧を取得（検索用） */
  listAll: () => Promise<Face[]>;
};

// ─── モック実装 ────────────────────────────────────────────────

export function createFaceMockRepositoryImpl(): FaceRepositorySpec {
  return {
    listByUserId: async (userId) => {
      return faces.filter((face) => face.userId === userId);
    },

    findById: async (faceId) => {
      return faces.find((face) => face.id === faceId) ?? null;
    },

    create: async (userId, input) => {
      // モック実装: ダミーの ID を付与して返却するだけ（実際には保存しない）
      const newFace: Face = {
        id: `face-mock-${Date.now()}`,
        userId,
        ...input,
      };
      return newFace;
    },

    update: async (faceId, userId, input) => {
      // モック実装: 既存データとマージして返却するだけ（実際には保存しない）
      const existing = faces.find((f) => f.id === faceId && f.userId === userId);
      const updated: Face = {
        id: faceId,
        userId,
        ...(existing ?? {}),
        ...input,
      };
      return updated;
    },

    delete: async (_faceId, _userId) => {
      // モック実装: no-op（実際には削除しない）
    },

    listAll: async () => {
      return faces;
    },
  };
}

export const faceMockRepositoryImpl: FaceRepositorySpec = createFaceMockRepositoryImpl();

/** Provider: DI の入口（実装の選択はここに閉じ込める） */
export const getFaceRepository = createSingletonProvider<FaceRepositorySpec>(
  () => faceMockRepositoryImpl
);

/** 互換用: 従来の import 口（Server 側でのみ使用する） */
export const faceRepository: FaceRepositorySpec = getFaceRepository();
