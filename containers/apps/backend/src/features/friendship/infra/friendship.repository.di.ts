import type { FriendshipRepositorySpec } from '../domain/friendship.repository';
import { getDb } from '../../../shared/infra/db/client';
import { createDrizzleFriendshipRepository } from './db/drizzle-friendship.repository.impl';

export function getFriendshipRepository(databaseUrl: string): FriendshipRepositorySpec {
  return createDrizzleFriendshipRepository(getDb(databaseUrl));
}
