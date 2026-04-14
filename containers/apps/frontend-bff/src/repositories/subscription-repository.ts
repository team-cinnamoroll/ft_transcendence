import { subscribedFaceIds } from "@/mocks/subscriptions";

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** SubscriptionRepository が提供するメソッドの型定義 */
export type SubscriptionRepository = {
  /** ログイン中ユーザーがサブスクライブしているフェイスID一覧を取得 */
  getSubscribedFaceIds: () => string[];
};

// ─── モック実装 ────────────────────────────────────────────────

export const subscriptionRepository: SubscriptionRepository = {
  getSubscribedFaceIds: () => {
    return subscribedFaceIds;
  },
};
