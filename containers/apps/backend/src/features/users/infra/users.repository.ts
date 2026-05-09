import type { UserRepositorySpec } from '../domain/users.entity';

import { getDb } from '../../../infra/db/client';
import { createDrizzleUserRepository } from './db/drizzle-user.repo';

export function getUserRepository(databaseUrl: string): UserRepositorySpec {
  return createDrizzleUserRepository(getDb(databaseUrl));
}
