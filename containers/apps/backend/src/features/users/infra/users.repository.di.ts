import type { UserRepositorySpec } from '../domain/users.repository';

import { getDb } from '../../../shared/infra/db/client';
import { createDrizzleUserRepository } from './db/drizzle-user.repository.impl';

export function getUserRepository(databaseUrl: string): UserRepositorySpec {
  return createDrizzleUserRepository(getDb(databaseUrl));
}
