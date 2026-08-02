import { SeedRepositorySpec } from '../domain/seed.repository';
import { getDb } from '../../../../shared/infra/db/client';
import { createDrizzleSeedRepository } from './db/drizzle-seed.repository.impl';

export function getSeedRepository(databaseUrl: string): SeedRepositorySpec {
  return createDrizzleSeedRepository(getDb(databaseUrl));
}
