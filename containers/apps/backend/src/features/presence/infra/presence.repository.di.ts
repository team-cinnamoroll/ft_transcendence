import { PresenceRepositorySpec } from '../domain/presence.repository';
import { getRedisClient } from '../../../shared/infra/redis/client';
import { createRedisPresenceRepository } from './redis/redis-presence.repository.impl';

export function getPresenceRepository(redisUrl: string): PresenceRepositorySpec {
  return createRedisPresenceRepository(getRedisClient(redisUrl));
}
