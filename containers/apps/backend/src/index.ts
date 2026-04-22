import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrationsOnce } from './infra/db/migrate';
import { parseEnv } from './env';
import { createUserRouter } from './features/auth/user.handler';
import type { DatabaseUrlEnv } from './shared/types/hono';

const app = new Hono<DatabaseUrlEnv>();

const env = parseEnv(process.env);

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
  .route('/users', createUserRouter(env));

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
      createServer: createHttpsServer,
      serverOptions: {
        key: readFileSync(tlsKeyPath),
        cert: readFileSync(tlsCertPath),
      },
    });
  } else {
    serve({ fetch: routes.fetch, port });
  }
}
