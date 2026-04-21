import { migrate } from 'drizzle-orm/postgres-js/migrator';
import fs from 'node:fs';
import path from 'node:path';
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

  // Vite build により単一バンドル(dist/index.js) になると、import.meta.url 基準の相対パスが
  // /drizzle のように壊れることがあります。実行時に存在するパスを優先して解決します。
  const candidates = [
    process.env.TRACEN_MIGRATIONS_FOLDER,
    path.resolve(process.cwd(), 'drizzle'),
    path.resolve(process.cwd(), 'containers/apps/backend/drizzle'),
    fileURLToPath(new URL('../../../drizzle', import.meta.url)),
  ].filter((p): p is string => Boolean(p));

  const migrationsFolder = candidates.find((p) => fs.existsSync(p)) ?? candidates[0];

  await retry(() => migrate(db, { migrationsFolder }), 10);
}
