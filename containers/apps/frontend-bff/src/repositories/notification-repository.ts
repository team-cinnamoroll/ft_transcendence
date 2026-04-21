import 'server-only';

import { type Notification } from '@/types/notification';
import { notifications } from '@/mocks/notifications';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** NotificationRepository が提供するメソッドの契約（Spec） */
export type NotificationRepositorySpec = {
  /** 全通知を createdAt 降順で取得 */
  listAll: () => Promise<Notification[]>;
};

// ─── モック実装 ────────────────────────────────────────────────

export function createNotificationMockRepositoryImpl(): NotificationRepositorySpec {
  return {
    listAll: async () => {
      return [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
  };
}

export const notificationMockRepositoryImpl: NotificationRepositorySpec =
  createNotificationMockRepositoryImpl();

/** Provider: DI の入口 */
export const getNotificationRepository = createSingletonProvider<NotificationRepositorySpec>(
  () => notificationMockRepositoryImpl
);

/** 互換用: 従来の import 口（Server 側でのみ使用する） */
export const notificationRepository: NotificationRepositorySpec = getNotificationRepository();
