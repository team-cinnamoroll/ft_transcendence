import type { RefreshToken, UserId } from '@tracen/contracts';
import { AuthRefreshTokenRepositorySpec } from '../../domain/auth.repository';
import { RedisClient } from '../../../../shared/infra/redis/client';
import {
  RefreshTokenData,
  ExpiresIn,
  FamilyId,
  modifyStatusToRevoked,
} from '../../domain/auth.entity';

const refreshKeyPrefix = 'refresh_token:'; // refresh_tokenのデータを管理するためのプレフィックス。キーは「refresh_token:{token}」の形式で保存される。
const familyKeyPrefix = 'family_token:'; // family_tokenに紐づく同世代のrefresh_tokenのSetを管理するためのプレフィックス。キーは「family_token:{familyId}」の形式で保存される。
const userKeyPrefix = 'user_tokens:'; // ユーザーIDに紐づくfamilyIdのSetを管理するためのプレフィックス。キーは「user_tokens:{userId}」の形式で保存される。
const revokedRemainingInSeconds = 3600;

function parseExpiresInToSeconds(expiresIn: ExpiresIn): number {
  const value = String(expiresIn).trim();
  const match = value.match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d|w|y)?$/i);

  if (!match) {
    throw new Error(`Invalid expiresIn value: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? 'ms').toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1 / 1000,
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    w: 60 * 60 * 24 * 7,
    y: 60 * 60 * 24 * 365,
  };

  return Math.max(1, Math.ceil(amount * multipliers[unit]));
}

class RedisRefreshTokenRepositoryImpl implements AuthRefreshTokenRepositorySpec {
  constructor(readonly redisClient: RedisClient) {}

  async saveToken(
    token: RefreshToken,
    data: RefreshTokenData,
    expiresIn: ExpiresIn
  ): Promise<void> {
    const tokenKey = `${refreshKeyPrefix}${token}`;
    const familyKey = `${familyKeyPrefix}${data.familyId}`;
    const userKey = `${userKeyPrefix}${data.userId}`;
    const expiresInSeconds = parseExpiresInToSeconds(expiresIn);
    const pipeline = this.redisClient.pipeline();

    pipeline.set(tokenKey, JSON.stringify(data), 'EX', expiresInSeconds);
    pipeline.sadd(familyKey, token);
    pipeline.sadd(userKey, data.familyId);
    pipeline.expire(familyKey, expiresInSeconds);
    pipeline.expire(userKey, expiresInSeconds);
    await pipeline.exec();
  }

  async revokeToken(token: RefreshToken): Promise<void> {
    const tokenKey = `${refreshKeyPrefix}${token}`;
    const result = await this.redisClient.get(tokenKey);
    if (!result) return; // トークンが見つからない場合は何もしない

    const data = JSON.parse(result) as RefreshTokenData;
    const revokedData = modifyStatusToRevoked(data); // トークンの状態を「revoked」に変更
    await this.redisClient.set(
      tokenKey,
      JSON.stringify(revokedData),
      'EX',
      revokedRemainingInSeconds
    );
  }

  async findToken(token: RefreshToken): Promise<RefreshTokenData | null> {
    const key = `${refreshKeyPrefix}${token}`;
    const result = await this.redisClient.get(key);
    if (!result) return null;
    return JSON.parse(result) as RefreshTokenData;
  }

  async deleteToken(token: RefreshToken): Promise<void> {
    const key = `${refreshKeyPrefix}${token}`;
    await this.redisClient.del(key);
  }

  async deleteAllTokensOfFamily(familyId: FamilyId): Promise<void> {
    const familyKey = `${familyKeyPrefix}${familyId}`;
    const tokens = await this.redisClient.smembers(familyKey);
    if (tokens.length === 0) return; // 家族IDに紐づくトークンがない場合は何もしない

    const keysToDelete = tokens.map((token) => `${refreshKeyPrefix}${token}`);

    const tokenDatas = await this.redisClient.mget(...keysToDelete);
    let userId: UserId | null = null;
    // MGETの結果（配列）をメモリ上でループして userId を探す（通信発生なし）
    for (const tokenData of tokenDatas) {
      if (tokenData) {
        try {
          const data = JSON.parse(tokenData) as RefreshTokenData;
          userId = data.userId;
          break; // 見つかったらループ終了
        } catch {
          continue;
        }
      }
    }

    keysToDelete.push(familyKey); // familyKeyも削除対象に追加

    const pipeline = this.redisClient.pipeline();
    pipeline.del(...keysToDelete);

    if (userId) {
      const userKey = `${userKeyPrefix}${userId}`;
      pipeline.srem(userKey, familyId); // 💡 Redisの仕様により、SREMの結果Setが空になれば userKey は自動消滅する
    }

    await pipeline.exec();
  }

  async deleteAllTokensOfUser(userId: UserId): Promise<void> {
    const userKey = `${userKeyPrefix}${userId}`;

    // 1. ユーザーに紐づく全ての家族IDを取得（通信1回目）
    const familyIds = await this.redisClient.smembers(userKey);
    if (familyIds.length === 0) return;

    // 2. 各家族に紐づくトークン一覧をパイプラインで一括取得（通信2回目）
    const fetchPipeline = this.redisClient.pipeline();
    for (const familyId of familyIds) {
      fetchPipeline.smembers(`${familyKeyPrefix}${familyId}`);
    }
    const fetchResults = await fetchPipeline.exec();

    // 3. 削除すべき「全てのキー」を配列にまとめる
    const keysToDelete: string[] = [];
    keysToDelete.push(userKey); // 💡 ユーザーキー自体も最後にまとめて消す

    if (fetchResults) {
      for (let i = 0; i < familyIds.length; i++) {
        const familyId = familyIds[i];
        keysToDelete.push(`${familyKeyPrefix}${familyId}`); // 家族のインデックスキー

        // パイプラインの結果からトークン一覧を取り出す
        const [error, tokens] = fetchResults[i];
        if (!error && tokens) {
          for (const token of tokens as string[]) {
            keysToDelete.push(`${refreshKeyPrefix}${token}`); // トークン本体のキー
          }
        }
      }
    }

    // 4. 全てのキーを1回の通信で一括削除（通信3回目）
    if (keysToDelete.length > 0) {
      await this.redisClient.del(...keysToDelete);
    }
  }
}

export function createRedisRefreshTokenRepository(
  redisClient: RedisClient
): AuthRefreshTokenRepositorySpec {
  return new RedisRefreshTokenRepositoryImpl(redisClient);
}
