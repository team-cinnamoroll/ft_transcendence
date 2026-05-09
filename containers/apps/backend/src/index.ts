import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrationsOnce } from './infra/db/migrate';
import { parseEnv } from './env';
import { usersRouter } from './features/users/users.handler';
import { signUpRouter } from './app_services/auth/sign-up/sign-up.handler';
import type { DatabaseUrlEnv } from './shared/types/hono';

const env = parseEnv(process.env);

const app = new Hono<DatabaseUrlEnv>().basePath('/api/v1');

if (env.RUN_MIGRATIONS) {
  await runMigrationsOnce(env.DATABASE_URL!);
}

const routes = app
  .get('/hello', (c) => {
    return c.json({ message: 'Hello from Hono!' });
  })
  .get('/health', (c) => {
    return c.json({ ok: true });
  })
  .route('/users', usersRouter(env))
  .route('/auth/sign-up', signUpRouter(env));

export type AppType = typeof routes;
export default routes;

const isDirectRun = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isDirectRun) {
  const port = env.PORT;

  const tlsCertPath = env.TLS_CERT_PATH;
  const tlsKeyPath = env.TLS_KEY_PATH;

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
