import type { UserId, IsOnline } from '@tracen/contracts';
import { PresenceRepositorySpec } from '../../domain/presence.repository';
import { RedisClient } from '../../../../shared/infra/redis/client';
import { ServiceUnavailableError } from '../../../../shared/errors/global.error';

const onlineKeyPrefix = 'online:user:';
const onlineKeyTTLSeconds = 90;
const fixedOnlineValue = '1'; // オンライン状態を示す固定値。実際の値は重要ではなく、キーの存在がオンライン状態を示す。

// エラー判定用のヘルパー
function isRedisError(error: unknown): error is Error & { code?: string } {
  return error instanceof Error;
}

class RedisPresenceRepositoryImpl implements PresenceRepositorySpec {
  constructor(private readonly redisClient: RedisClient) {}

  // ハートビート受信：TTLを90秒に設定して保存（上書き）
  async setOnline(userId: UserId): Promise<void> {
    try {
      await this.redisClient.set(
        `${onlineKeyPrefix}${userId}`,
        fixedOnlineValue,
        'EX',
        onlineKeyTTLSeconds
      );
    } catch (error: unknown) {
      if (isRedisError(error)) {
        // メモリ枯渇エラー
        if (error.message.includes('OOM')) {
          console.error(`Redis OOM Error for userId ${userId}:`, error);
          throw new ServiceUnavailableError('Presence service storage is full.');
        }
        // 接続系エラー
        if (error.code === 'ECONNREFUSED' || error.message.includes('ETIMEDOUT')) {
          console.error(`Redis connection failed for userId ${userId}:`, error);
          throw new ServiceUnavailableError('Presence service is currently unavailable.');
        }
      }
      // その他予期せぬエラー
      throw new Error(`Failed to set online status for user ${userId}`, { cause: error });
    }
  }

  // オフライン化（ブラウザクローズ時など）
  async setOffline(userId: UserId): Promise<void> {
    try {
      await this.redisClient.del(`${onlineKeyPrefix}${userId}`);
    } catch (error: unknown) {
      // オフライン化の失敗も同様にハンドリング
      console.error(`Failed to set offline status for user ${userId}:`, error);
      if (isRedisError(error)) {
        // メモリ枯渇エラー
        if (error.message.includes('OOM')) {
          console.error(`Redis OOM Error for userId ${userId}:`, error);
          throw new ServiceUnavailableError('Presence service storage is full.');
        }
        // 接続系エラー
        if (error.code === 'ECONNREFUSED' || error.message.includes('ETIMEDOUT')) {
          console.error(`Redis connection failed for userId ${userId}:`, error);
          throw new ServiceUnavailableError('Presence service is currently unavailable.');
        }
      }
      throw new Error(`Failed to set offline status for user ${userId}`, { cause: error });
    }
  }

  // ページネーションポーリング用：複数IDの状態をMGETで一括取得
  async getOnlineStatuses(userIds: UserId[]): Promise<Record<UserId, IsOnline>> {
    if (userIds.length === 0) {
      return {};
    }
    const keys = userIds.map((userId) => `${onlineKeyPrefix}${userId}`);

    try {
      const values = await this.redisClient.mget(...keys);
      const result: Record<UserId, IsOnline> = {};
      userIds.forEach((userId, index) => {
        result[userId] = values[index] !== null; // キーが存在すればオンラインとみなす（値は常に'1'）
      });
      return result;
    } catch (error: unknown) {
      if (isRedisError(error)) {
        // メモリ枯渇エラー
        if (error.message.includes('OOM')) {
          console.error(`Redis OOM Error for userId ${userIds.join(', ')}:`, error);
        }
        // 接続系エラー
        if (error.code === 'ECONNREFUSED' || error.message.includes('ETIMEDOUT')) {
          console.error(`Redis connection failed for userId ${userIds.join(', ')}:`, error);
        }
        console.warn(`Redis unavailable. Defaulting all requested users to offline.`);
        // フォールバックとして、全てのユーザーをオフラインとみなす場合:
        // const fallback: Record<UserId, IsOnline> = {};
        // userIds.forEach(id => fallback[id] = false);
        // return fallback;
        throw new ServiceUnavailableError('Presence service is unavailable.');
      }
      throw new Error('Failed to get online statuses', { cause: error });
    }
  }
}

export function createRedisPresenceRepository(redisClient: RedisClient): PresenceRepositorySpec {
  return new RedisPresenceRepositoryImpl(redisClient);
}
