import { UserId, IsOnline } from '@tracen/contracts';

export type PresenceRepositorySpec = {
  // ハートビート受信：TTLを90秒に設定して保存（上書き）
  setOnline(userId: UserId): Promise<void>;
  // オフライン化（ブラウザクローズ時など）
  setOffline(userId: UserId): Promise<void>;
  // ページネーションポーリング用：複数IDの状態を一括取得
  getOnlineStatuses(userIds: UserId[]): Promise<Record<UserId, IsOnline>>;
};
