import type { RefreshToken } from '@tracen/contracts';
import { AuthRefreshTokenRepositorySpec } from '../../domain/auth.repository';
import { RedisClient } from '../../../../shared/infra/redis/client';
import { RefreshTokenData, ExpiresIn, FamilyId } from '../../domain/auth.entity';

const tokenKeyPrefix = 'refresh_token:';
const familyKeyPrefix = 'family_token:';

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
    const tokenKey = `${tokenKeyPrefix}${token}`;
    const familyKey = `${familyKeyPrefix}${data.familyId}`;
    const expiresInSeconds = parseExpiresInToSeconds(expiresIn);
    const pipeline = this.redisClient.pipeline();

    pipeline.set(tokenKey, JSON.stringify(data), 'EX', expiresInSeconds);
    pipeline.sadd(familyKey, token);
    pipeline.expire(familyKey, expiresInSeconds);
    await pipeline.exec();
  }

  async findToken(token: RefreshToken): Promise<RefreshTokenData | null> {
    const key = `${tokenKeyPrefix}${token}`;
    const result = await this.redisClient.get(key);
    if (!result) return null;
    return JSON.parse(result) as RefreshTokenData;
  }

  async deleteToken(token: RefreshToken): Promise<void> {
    const key = `${tokenKeyPrefix}${token}`;
    await this.redisClient.del(key);
  }

  async deleteAllTokensByFamilyId(familyId: FamilyId): Promise<void> {
    const familyKey = `${familyKeyPrefix}${familyId}`;
    const tokens = await this.redisClient.smembers(familyKey);
    if (tokens.length === 0) return; // 家族IDに紐づくトークンがない場合は何もしない

    const keysToDelete = tokens.map((token) => `${tokenKeyPrefix}${token}`);
    keysToDelete.push(familyKey); // familyKeyも削除対象に追加

    await this.redisClient.del(...keysToDelete);
  }
}

export function createRedisRefreshTokenRepository(
  redisClient: RedisClient
): AuthRefreshTokenRepositorySpec {
  return new RedisRefreshTokenRepositoryImpl(redisClient);
}
