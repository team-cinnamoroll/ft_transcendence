import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEnv } from './env';

const app = new Hono();
const _route = app.get('/hello', (c) => {
  return c.json({ message: 'Hello from Hono!' });
});

export type AppType = typeof _route;
export default app;

const isDirectRun = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isDirectRun) {
  const env = parseEnv(process.env);
  const port = env.PORT;

  const tlsCertPath = env.TLS_CERT_PATH;
  const tlsKeyPath = env.TLS_KEY_PATH;

  if (tlsCertPath && tlsKeyPath) {
    serve({
      fetch: app.fetch,
      port,
      createServer: createHttpsServer,
      serverOptions: {
        key: readFileSync(tlsKeyPath),
        cert: readFileSync(tlsCertPath),
      },
    });
  } else {
    serve({ fetch: app.fetch, port });
  }
}
