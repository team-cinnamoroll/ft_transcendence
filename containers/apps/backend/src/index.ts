import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrationsOnce } from './shared/infra/db/migrate';
import { parseEnv } from './env';
import { injectConfig } from './shared/middleware/inject-config';
import { usersRouter } from './features/users/users.handler';
import { signUpRouter } from './app_services/auth/sign-up/sign-up.handler';
import type { AppEnv } from './shared/types/hono';

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
  .route('/users', usersRouter())
  .route('/auth/sign-up', signUpRouter());

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
