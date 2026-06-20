import { Hono } from 'hono';
import type { AppEnv } from './shared/types/hono';

import { wellKnownRouter } from './app_services/well-known/well-known.handler';
import { authRouter } from './app_services/auth/auth.handler';

import { getRedisClient } from './shared/infra/redis/client';

export function publicRouter() {
  return new Hono<AppEnv>()
    .get('/hello', (c) => {
      return c.json({ message: 'Hello from Hono!' });
    })
    .get('/health', (c) => {
      return c.json({ ok: true });
    })
    .get('/health/redis', async (c) => {
      const config = c.get('config');
      const redis = getRedisClient(config.REDIS_URL);
      const key = `health_check:${Date.now()}:${Math.random().toString(36).slice(2)}`;
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
    .route('/auth', authRouter());
}
