import 'server-only';

import { subscribedFaceIds } from '@/mocks/subscriptions';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** SubscriptionRepository が提供するメソッドの契約（Spec） */
export type SubscriptionRepositorySpec = {
  /** ログイン中ユーザーがサブスクライブしているフェイスID一覧を取得 */
  getSubscribedFaceIds: () => Promise<string[]>;
};

// ─── モック実装 ────────────────────────────────────────────────

export function createSubscriptionMockRepositoryImpl(): SubscriptionRepositorySpec {
  return {
    getSubscribedFaceIds: async () => {
      return subscribedFaceIds;
    },
  };
}

export const subscriptionMockRepositoryImpl: SubscriptionRepositorySpec =
  createSubscriptionMockRepositoryImpl();

/** Provider: DI の入口 */
export const getSubscriptionRepository = createSingletonProvider<SubscriptionRepositorySpec>(
  () => subscriptionMockRepositoryImpl
);

/** 互換用: 従来の import 口（Server 側でのみ使用する） */
export const subscriptionRepository: SubscriptionRepositorySpec = getSubscriptionRepository();
