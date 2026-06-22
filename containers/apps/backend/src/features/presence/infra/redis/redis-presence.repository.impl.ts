import type { UserId } from '@tracen/contracts';
import { PresenceRepositorySpec } from '../../domain/presence.repository';
import { RedisClient } from '../../../../shared/infra/redis/client';

const onlineKeyPrefix = 'online:user:';
const onlineKeyTTLSeconds = 90;
const fixedOnlineValue = '1'; // オンライン状態を示す固定値。実際の値は重要ではなく、キーの存在がオンライン状態を示す。

class RedisPresenceRepositoryImpl implements PresenceRepositorySpec {
  constructor(private readonly redisClient: RedisClient) {}

  // ハートビート受信：TTLを90秒に設定して保存（上書き）
  async setOnline(userId: UserId): Promise<void> {
    await this.redisClient.set(
      `${onlineKeyPrefix}${userId}`,
      fixedOnlineValue,
      'EX',
      onlineKeyTTLSeconds
    );
  }

  // オフライン化（ブラウザクローズ時など）
  async setOffline(userId: UserId): Promise<void> {
    await this.redisClient.del(`${onlineKeyPrefix}${userId}`);
  }

  // ページネーションポーリング用：複数IDの状態をMGETで一括取得
  async getOnlineStatuses(userIds: UserId[]): Promise<Record<UserId, boolean>> {
    if (userIds.length === 0) {
      return {};
    }
    const keys = userIds.map((userId) => `${onlineKeyPrefix}${userId}`);
    const values = await this.redisClient.mget(...keys);
    const result: Record<UserId, boolean> = {};
    userIds.forEach((userId, index) => {
      result[userId] = values[index] !== null; // キーが存在すればオンラインとみなす（値は常に'1'）
    });
    return result;
  }
}

export function createRedisPresenceRepository(redisClient: RedisClient): PresenceRepositorySpec {
  return new RedisPresenceRepositoryImpl(redisClient);
}
