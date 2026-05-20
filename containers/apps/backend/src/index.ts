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
import { signUpRouter } from './app_services/auth/sign-up/sign-up.handler';
import { signInRouter } from './app_services/auth/sign-in/sign-in.handler';
import type { AppEnv } from './shared/types/hono';

const config = parseEnv(process.env);

if (config.RUN_MIGRATIONS) {
  await runMigrationsOnce(config.DATABASE_URL);
}

const app = new Hono<AppEnv>().basePath('/api/v1');

const routes = app
  .use('*', injectConfig(config))
  .route('/.well-known', wellKnownRouter())
  .get('/hello', (c) => {
    return c.json({ message: 'Hello from Hono!' });
  })
  .get('/health', (c) => {
    return c.json({ ok: true });
  })
  .route('/auth/sign-up', signUpRouter())
  .route('/auth/sign-in', signInRouter())
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
