import { type Notification } from "@/types/notification";
import { notifications } from "@/mocks/notifications";

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** NotificationRepository が提供するメソッドの型定義 */
export type NotificationRepository = {
  /** 全通知を createdAt 降順で取得 */
  listAll: () => Notification[];
};

// ─── モック実装 ────────────────────────────────────────────────

export const notificationRepository: NotificationRepository = {
  listAll: () => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};
