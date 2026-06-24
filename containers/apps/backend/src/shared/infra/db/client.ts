import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as usersSchema from '../../../features/users/infra/db/schema';

export const appSchema = {
  ...usersSchema,
};

export type TracenDb = PostgresJsDatabase<typeof appSchema>;

type GlobalDbCache = {
  __tracenDb?: TracenDb;
  __tracenDbUrl?: string;
};

const globalCache = globalThis as unknown as GlobalDbCache;

export function getDb(databaseUrl: string): TracenDb {
  if (globalCache.__tracenDb && globalCache.__tracenDbUrl === databaseUrl) {
    return globalCache.__tracenDb;
  }

  const sql = postgres(databaseUrl);
  const db = drizzle(sql, { schema: appSchema });

  globalCache.__tracenDb = db;
  globalCache.__tracenDbUrl = databaseUrl;

  return db;
}
