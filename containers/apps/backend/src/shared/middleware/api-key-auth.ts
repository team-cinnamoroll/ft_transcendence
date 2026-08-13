import { createMiddleware } from 'hono/factory';
import { rateLimiter } from 'hono-rate-limiter';
import { ApiKeyEnv } from '../types/hono';
import { getRedisClient } from '../infra/redis/client';
import { IoredisStore, WINDOW_MS } from '../infra/redis/ioredis-store';
import { ApiKeySchema } from '../../features/auth/domain/auth.entity';
import { makeSafeResponse } from '../utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

// 仮のAPIキー検証関数
async function validateApiKey(key: string, masterApiKey: string): Promise<boolean> {
  // 実装例: DB検索やRedisキャッシュの照合など
  return key === masterApiKey;
  // return key.startsWith('sk_live_');
}

// 1. APIキー認証ミドルウェア
const apiKeyAuth = createMiddleware<ApiKeyEnv>(async (c, next) => {
  const rowApiKey = c.req.header('x-api-key');
  if (!rowApiKey) {
    return c.json(
      makeSafeResponse(SimpleApiResponseSchema, {
        success: false,
        message: 'Unauthorized: Missing API Key',
      }),
      401
    );
  }
  const apiKey = ApiKeySchema.safeParse(rowApiKey);

  if (!apiKey.success) {
    return c.json(
      makeSafeResponse(SimpleApiResponseSchema, {
        success: false,
        message: 'Unauthorized: Invalid API Key Format',
      }),
      401
    );
  }

  const masterApiKey = c.get('config').MASTER_API_KEY;
  if (!masterApiKey) {
    return c.json(
      makeSafeResponse(SimpleApiResponseSchema, {
        success: false,
        message: 'Server Error: Master API Key not configured',
      }),
      500
    );
  }

  // TODO: DBやRedis、環境変数などと照合してAPIキーを検証するロジック
  const isValid = await validateApiKey(apiKey.data, masterApiKey);
  if (!isValid) {
    return c.json(
      makeSafeResponse(SimpleApiResponseSchema, {
        success: false,
        message: 'Unauthorized: Invalid API Key',
      }),
      401
    );
  }

  // 後続のレート制限ミドルウェアやハンドラーで使うため Context に保存
  c.set('apiKey', apiKey.data);

  await next();
});

const DEFAULT_API_KEY_RATE_LIMIT = 500; // 1分あたり最大500リクエスト

// 2. APIキー用レート制限ミドルウェア（IoredisStoreを再利用）
const apiKeyRateLimiter = createMiddleware<ApiKeyEnv>(async (c, next) => {
  const redisURL = c.get('config').REDIS_URL;
  const redisClient = getRedisClient(redisURL);
  const masterApiKey = c.get('config').MASTER_API_KEY;
  const masterApiKeyRateLimit = c.get('config').MASTER_API_KEY_RATE_LIMIT;

  const limiter = rateLimiter<ApiKeyEnv>({
    windowMs: WINDOW_MS, // 1分間
    limit: async (c) => {
      const apiKey = c.get('apiKey');
      if (apiKey === masterApiKey) {
        // マスターAPIキーの場合は制限をかけない
        return masterApiKeyRateLimit;
      }
      return DEFAULT_API_KEY_RATE_LIMIT;
    },
    standardHeaders: 'draft-6',

    // KeyGeneratorで API キーを識別子として返します
    keyGenerator: (c) => {
      const apiKey = c.get('apiKey');
      // Redis内でのキー重複を防ぐため、接頭辞（接頭語）を付けます
      return `rate-limit:apikey:${apiKey}`;
    },

    // 以前作成した IoredisStore をそのまま渡す
    store: new IoredisStore(redisClient),
  });

  return limiter(c, next);
});

// 保護対象にするパスリスト（前方一致）
const TARGET_PATHS = [
  '/api/v1/auth/sign-up',
  '/api/v1/auth/sign-in',
  '/api/v1/auth/refresh',
  '/api/v1/admin/users',
];

export const selectiveApiProtection = createMiddleware<ApiKeyEnv>(async (c, next) => {
  const currentPath = c.req.path;

  // 現在のパスが対象に含まれるか判定
  const isTarget = TARGET_PATHS.some((path) => currentPath.startsWith(path));

  // 対象外パスの場合は認証もレート制限もスキップして次のハンドラーへ
  if (!isTarget) {
    return next();
  }

  // ★重要: apiKeyAuth を呼び出し、その next() として apiKeyRateLimiter(c, next) を実行する
  return apiKeyAuth(c, async () => {
    await apiKeyRateLimiter(c, next);
  });
});
