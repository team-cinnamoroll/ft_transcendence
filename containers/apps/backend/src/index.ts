import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { ApplyGlobalResponse } from 'hono/client';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrationsOnce } from './shared/infra/db/migrate';
import { parseEnv } from './env';
import { injectConfig } from './shared/middleware/inject-config';
import { injectJwtAuthDeps } from './shared/middleware/inject-jwk-auth';
import { jwtRateLimiter } from './shared/middleware/jwt-rate-limiter';
import { selectiveApiProtection } from './shared/middleware/api-key-auth';

import type { AppEnv } from './shared/types/hono';
import { publicApiRouter } from './public.handler';
import { protectedApiRouter } from './protected.handler';
import { type GlobalErrorResponse, globalErrorHandler } from './global.error.handler';

let config: ReturnType<typeof parseEnv> | null = null;

try {
  config = parseEnv(process.env);

  if (config.RUN_MIGRATIONS && config.NODE_ENV === 'production') {
    await runMigrationsOnce(config.DATABASE_URL);
  }
} catch (error) {
  console.error('Error during migration:', error);
  // process.exit(1);
}

const app = new Hono<AppEnv>();

// 全局共通ミドルウェア
app.use('*', injectConfig(config ? config : undefined));

// 静的ファイル配信ミドルウェア
const staticRoot = `${config?.FILE_STORAGE_BASE_DIR || '/app/uploads'}/public-bucket/`;
app.use(
  '/static/public-bucket/*',
  serveStatic({
    root: staticRoot,
    rewriteRequestPath: (path) => {
      const rewritten = path.replace(/^\/static\/public-bucket\//, '');
      // console.log(`[serveStatic DEBUG] Incoming URL: "${path}" --> Rewritten to: "${rewritten}"`);
      return rewritten;
    },
    // onNotFound: (path, c) => {
    //   console.log(`[serveStatic DEBUG] ❌ 404 NOT FOUND`);
    //   console.log(`  - staticRoot (設定されたルート): "${staticRoot}"`);
    //   console.log(`  - Honoが結合しようとしたファイル相対パス: "${path}"`);
    // },
  })
);

// APIルートの設定
const apiApp = new Hono<AppEnv>();
const apiRoutes = apiApp
  .basePath('/api/v1')
  .use('*', selectiveApiProtection) // APIキー認証が必要なルートを保護
  .route('/', publicApiRouter())
  .use('*', injectJwtAuthDeps())
  .use('*', jwtRateLimiter)
  .route('/', protectedApiRouter());

app.route('/', apiRoutes);

// グローバルエラーハンドラを設定
app.onError(globalErrorHandler);

export type AppType = ApplyGlobalResponse<typeof apiRoutes, GlobalErrorResponse>;
export default app;

const isDirectRun = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isDirectRun) {
  const port = config?.PORT || 8000;

  const tlsCertPath = config?.TLS_CERT_PATH;
  const tlsKeyPath = config?.TLS_KEY_PATH;

  if (tlsCertPath && tlsKeyPath) {
    serve({
      fetch: app.fetch,
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
      fetch: app.fetch,
      port,
      hostname: '0.0.0.0',
    });
  }
}
