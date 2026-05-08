import type { Email } from '@tracen/contracts';
import type { UserEntity, UserId } from './users.entity';

import { getDb } from '../../../infra/db/client';
import { createDrizzleUserRepository } from '../infra/drizzle-user.repo';

export type UserRepositorySpec = {
  findById: (id: UserId) => Promise<UserEntity | null>;
  deleteById: (id: UserId) => Promise<boolean>;
  findByEmail: (email: Email) => Promise<UserEntity | null>;
  create: (data: UserEntity) => Promise<UserEntity>;
};

export function getUserRepository(databaseUrl: string): UserRepositorySpec {
  return createDrizzleUserRepository(getDb(databaseUrl));
}
