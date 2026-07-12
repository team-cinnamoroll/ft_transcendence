import type { UserProfileRepositorySpec } from '../domain/user-profile.repository';
import { getDb } from '../../../shared/infra/db/client';
import { createDrizzleUserProfileRepository } from './db/drizzle-user-profile.repository.impl';

export function getUserProfileRepository(databaseUrl: string): UserProfileRepositorySpec {
  return createDrizzleUserProfileRepository(getDb(databaseUrl));
}
