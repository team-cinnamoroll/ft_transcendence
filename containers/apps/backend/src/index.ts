import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { ApplyGlobalResponse } from 'hono/client';
import { serveStatic } from '@hono/node-server/serve-static';
import { jwk } from 'hono/jwk';
import { readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrationsOnce } from './shared/infra/db/migrate';
import { parseEnv } from './env';
import { injectConfig } from './shared/middleware/inject-config';

import type { AppEnv } from './shared/types/hono';
import { publicApiRouter } from './public.handler';
import { protectedApiRouter } from './protected.handler';
import { type GlobalErrorResponse, globalErrorHandler } from './global.error.handler';

const config = parseEnv(process.env);

if (config.RUN_MIGRATIONS && config.NODE_ENV === 'production') {
  await runMigrationsOnce(config.DATABASE_URL);
}

const app = new Hono<AppEnv>();

// 全局共通ミドルウェア
app.use('*', injectConfig(config));

// 静的ファイル配信ミドルウェア
const staticRoot = `${config.FILE_STORAGE_BASE_DIR || '/app/uploads'}/public-bucket/`;
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
  .route('/', publicApiRouter())
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
  const port = config.PORT;

  const tlsCertPath = config.TLS_CERT_PATH;
  const tlsKeyPath = config.TLS_KEY_PATH;

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
