import { AuthRefreshTokenRepositorySpec } from '../domain/auth.repository';
import { getRedisClient } from '../../../shared/infra/redis/client';
import { createRedisRefreshTokenRepository } from './redis/redis-refresh-token.repository.impl';

export function getAuthRefreshTokenRepository(redisUrl: string): AuthRefreshTokenRepositorySpec {
  return createRedisRefreshTokenRepository(getRedisClient(redisUrl));
}
