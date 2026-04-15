import { type Activity } from "@/types/activity";
import { activities } from "@/mocks/activities";

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** ActivityRepository が提供するメソッドの型定義 */
export type ActivityRepository = {
  /** 指定ユーザーのアクティビティ一覧を取得 */
  listByUserId: (userId: string) => Activity[];
  /** 指定フェイスのアクティビティ一覧を取得 */
  listByFaceId: (faceId: string) => Activity[];
  /** 全アクティビティ一覧を取得（タイムライン用・createdAt 降順） */
  listAll: () => Activity[];
  /** 指定フェイスIDリストに含まれるアクティビティ一覧を取得（サブスク用・createdAt 降順） */
  listByFaceIds: (faceIds: string[]) => Activity[];
  /** ID でアクティビティを1件取得（存在しない場合は undefined） */
  findById: (activityId: string) => Activity | undefined;
};

// ─── モック実装 ────────────────────────────────────────────────

/** createdAt の降順でソートするヘルパー */
const sortByCreatedAtDesc = (list: Activity[]): Activity[] =>
  [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

export const activityRepository: ActivityRepository = {
  listByUserId: (userId) => {
    return sortByCreatedAtDesc(
      activities.filter((activity) => activity.userId === userId)
    );
  },

  listByFaceId: (faceId) => {
    return sortByCreatedAtDesc(
      activities.filter((activity) => activity.faceId === faceId)
    );
  },

  listAll: () => {
    return sortByCreatedAtDesc(activities);
  },

  listByFaceIds: (faceIds) => {
    return sortByCreatedAtDesc(
      activities.filter((activity) => faceIds.includes(activity.faceId))
    );
  },

  findById: (activityId) => {
    return activities.find((activity) => activity.id === activityId);
  },
};
