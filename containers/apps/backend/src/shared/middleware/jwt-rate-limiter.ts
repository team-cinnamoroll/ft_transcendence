import { createMiddleware } from 'hono/factory';
import { ProtectedEnv } from '../types/hono';
import { rateLimiter } from 'hono-rate-limiter';
import { getRedisClient } from '../infra/redis/client';
import type { Redis } from 'ioredis';

const WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT = 100; // 100 requests per window

export class IoredisStore {
  private client: Redis;
  private windowMs: number = WINDOW_MS;

  constructor(client: Redis) {
    this.client = client;
  }

  init(options: { windowMs: number }) {
    this.windowMs = options.windowMs;
  }

  async increment(key: string) {
    const multi = this.client.multi();
    multi.incr(key);
    multi.ttl(key);

    const results = await multi.exec();
    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const [[err1, totalHits], [err2, ttl]] = results as [
      [Error | null, number],
      [Error | null, number],
    ];
    if (err1 || err2) throw err1 || err2;

    // 初回アクセス（TTL未設定）時にウィンドウ時間を設定
    if (ttl === -1) {
      await this.client.pexpire(key, this.windowMs);
    }

    return {
      totalHits,
      resetTime: new Date(Date.now() + (ttl > 0 ? ttl * 1000 : this.windowMs)),
    };
  }

  async decrement(key: string): Promise<void> {
    await this.client.decr(key);
  }

  async resetKey(key: string): Promise<void> {
    await this.client.del(key);
  }
}

export const jwtRateLimiter = createMiddleware<ProtectedEnv>(async (c, next) => {
  const redisURL = c.get('config').REDIS_URL;
  const redisClient = getRedisClient(redisURL);

  const limiter = rateLimiter<ProtectedEnv>({
    windowMs: WINDOW_MS,
    limit: RATE_LIMIT,
    standardHeaders: 'draft-6', // Return rate limit info in the `RateLimit-*` headers

    keyGenerator: (c) => {
      const jwtPayload = c.get('jwtPayload');
      return jwtPayload?.sub ?? 'anonymous'; // Use the user ID from the JWT payload as the key
    },

    store: new IoredisStore(redisClient),
  });

  return limiter(c, next);
});
