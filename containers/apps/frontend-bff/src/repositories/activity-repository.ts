import 'server-only';

import { type Seed } from '@/types/seed';
import { seeds } from '@/mocks/seeds';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** ActivityRepository が提供するメソッドの契約（Spec） */
export type ActivityRepositorySpec = {
  /** 指定ユーザーのアクティビティ一覧を取得 */
  listByUserId: (userId: string) => Promise<Seed[]>;
  /** 指定フェイスのアクティビティ一覧を取得 */
  listByFaceId: (faceId: string) => Promise<Seed[]>;
  /** 全アクティビティ一覧を取得（タイムライン用・createdAt 降順） */
  listAll: () => Promise<Seed[]>;
  /** 指定フェイスIDリストに含まれるアクティビティ一覧を取得（サブスク用・createdAt 降順） */
  listByFaceIds: (faceIds: string[]) => Promise<Seed[]>;
  /** ID でアクティビティを1件取得（存在しない場合は null） */
  findById: (activityId: string) => Promise<Seed | null>;
};

// ─── モック実装 ────────────────────────────────────────────────

/** createdAt の降順でソートするヘルパー */
const sortByCreatedAtDesc = (list: Seed[]): Seed[] =>
  [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export function createActivityMockRepositoryImpl(): ActivityRepositorySpec {
  return {
    listByUserId: async (userId) => {
      return sortByCreatedAtDesc(seeds.filter((activity) => activity.userId === userId));
    },

    listByFaceId: async (faceId) => {
      return sortByCreatedAtDesc(seeds.filter((activity) => activity.faceId === faceId));
    },

    listAll: async () => {
      return sortByCreatedAtDesc(seeds);
    },

    listByFaceIds: async (faceIds) => {
      return sortByCreatedAtDesc(
        seeds.filter((activity) => faceIds.includes(activity.faceId))
      );
    },

    findById: async (activityId) => {
      return seeds.find((activity) => activity.id === activityId) ?? null;
    },
  };
}

export const activityMockRepositoryImpl: ActivityRepositorySpec =
  createActivityMockRepositoryImpl();

/** Provider: DI の入口 */
export const getActivityRepository = createSingletonProvider<ActivityRepositorySpec>(
  () => activityMockRepositoryImpl
);

/** 互換用: 従来の import 口（Server 側でのみ使用する） */
export const activityRepository: ActivityRepositorySpec = getActivityRepository();
