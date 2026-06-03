import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { jwk } from 'hono/jwk';
import { readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrationsOnce } from './shared/infra/db/migrate';
import { parseEnv } from './env';
import { injectConfig } from './shared/middleware/inject-config';
import { wellKnownRouter } from './app_services/well-known/well-known.handler';
import { usersRouter } from './features/users/users.handler';
import { authRouter } from './app_services/auth/auth.handler';
import type { AppEnv } from './shared/types/hono';

import { getRedisClient } from './shared/infra/redis/client';

const config = parseEnv(process.env);

if (config.RUN_MIGRATIONS) {
  await runMigrationsOnce(config.DATABASE_URL);
}

const app = new Hono<AppEnv>().basePath('/api/v1');

const routes = app
  .use('*', injectConfig(config))
  .get('/hello', (c) => {
    return c.json({ message: 'Hello from Hono!' });
  })
  .get('/health', (c) => {
    return c.json({ ok: true });
  })
  .get('/health/redis', async (c) => {
    const redis = getRedisClient(config.REDIS_URL);
    const key = 'health_check';
    const value = `ok_${Date.now()}`;
    try {
      await redis.ping();
      await redis.set(key, value, 'EX', 10); // 10秒間有効なキーをセット
      const result = await redis.get(key);
      if (result !== value) {
        throw new Error('Redis read/write verification failed');
      }
      await redis.del(key); // クリーンアップ
      return c.json({ redis: 'ok', result: result });
    } catch (err) {
      console.error('Redis health check failed:', err);
      if (err instanceof Error) {
        return c.json({ redis: 'error', details: err.message }, 500);
      } else {
        return c.json({ redis: 'error', details: 'An unknown error occurred' }, 500);
      }
    }
  })
  .route('/.well-known', wellKnownRouter())
  .route('/auth', authRouter())
  .use(
    '*',
    jwk({
      // 関数形式で、メモリ内の jwksCache.keys 配列を直接返す
      keys: async (c) => {
        const jwksCache = c.get('config').JWKS_PUBLIC;
        if (!jwksCache) return [];
        // Zodのパースを通過した安全な JWK 配列をそのまま流し込む
        return jwksCache.keys;
      },
      // ⚠️ 許可する非対称鍵アルゴリズムを明示（必須）
      alg: ['RS256'],
    })
  )
  .route('/users', usersRouter());

export type AppType = typeof routes;
export default routes;

const isDirectRun = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isDirectRun) {
  const port = config.PORT;

  const tlsCertPath = config.TLS_CERT_PATH;
  const tlsKeyPath = config.TLS_KEY_PATH;

  if (tlsCertPath && tlsKeyPath) {
    serve({
      fetch: routes.fetch,
      port,
      hostname: '0.0.0.0',
      createServer: createHttpsServer,
      serverOptions: {
        key: readFileSync(tlsKeyPath),
        cert: readFileSync(tlsCertPath),
      },
    });
  } else {
    serve({
      fetch: routes.fetch,
      port,
      hostname: '0.0.0.0',
    });
  }
}
