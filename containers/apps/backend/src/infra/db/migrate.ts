import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';

import { retry } from '../../shared/utils/async';
import { getDb } from './client';

type GlobalMigrateCache = {
  __tracenMigratePromise?: Promise<void>;
};

const globalCache = globalThis as unknown as GlobalMigrateCache;

export async function runMigrationsOnce(databaseUrl: string): Promise<void> {
  if (!globalCache.__tracenMigratePromise) {
    globalCache.__tracenMigratePromise = runMigrations(databaseUrl);
  }

  return globalCache.__tracenMigratePromise;
}

async function runMigrations(databaseUrl: string): Promise<void> {
  const db = getDb(databaseUrl);
  const migrationsFolder = fileURLToPath(new URL('../../../drizzle', import.meta.url));

  await retry(() => migrate(db, { migrationsFolder }), 10);
}