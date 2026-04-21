import type { MiddlewareHandler } from 'hono';

import type { AppEnv } from '../../env';
import type { DatabaseUrlEnv } from '../types/hono';

export function requireDatabaseUrl(env: AppEnv): MiddlewareHandler<DatabaseUrlEnv> {
  return async (c, next) => {
    if (!env.DATABASE_URL) {
      return c.json({ message: 'DATABASE_URL is required' }, 500);
    }

    c.set('databaseUrl', env.DATABASE_URL);
    await next();
  };
}