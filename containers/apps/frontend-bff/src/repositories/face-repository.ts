import 'server-only';

import { type Face } from '@/types/face';
import { faces } from '@/mocks/faces';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** フェイス作成時の入力型（id・userId は自動付与のため不要） */
export type CreateFaceInput = Omit<Face, 'id' | 'userId'>;

/** FaceRepository が提供するメソッドの契約（Spec） */
export type FaceRepositorySpec = {
  /** 指定ユーザーのフェイス一覧を取得 */
  listByUserId: (userId: string) => Promise<Face[]>;
  /** ID でフェイスを1件取得（存在しない場合は null） */
  findById: (faceId: string) => Promise<Face | null>;
  /** フェイスを作成（モック実装はダミー返却） */
  create: (userId: string, input: CreateFaceInput) => Promise<Face>;
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
