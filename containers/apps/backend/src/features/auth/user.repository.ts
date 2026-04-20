import type { CreateUserInput, User, UserId } from './user.entity';

import { getDb, type TracenDb } from '../../infra/db/client';
import { createDrizzleUserRepository } from '../../infra/repositories/drizzle-user.repo';

export type UserRepositorySpec = {
  findById: (id: UserId) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  create: (data: CreateUserInput) => Promise<User>;
};

export function createUserRepository(db: TracenDb): UserRepositorySpec {
  return createDrizzleUserRepository(db);
}

type GlobalUserRepositoryCache = {
  __tracenUserRepository?: UserRepositorySpec;
  __tracenUserRepositoryUrl?: string;
};

const globalCache = globalThis as unknown as GlobalUserRepositoryCache;

export function getUserRepository(databaseUrl: string): UserRepositorySpec {
  if (globalCache.__tracenUserRepository && globalCache.__tracenUserRepositoryUrl === databaseUrl) {
    return globalCache.__tracenUserRepository;
  }

  const repo = createUserRepository(getDb(databaseUrl));
  globalCache.__tracenUserRepository = repo;
  globalCache.__tracenUserRepositoryUrl = databaseUrl;
  return repo;
}
