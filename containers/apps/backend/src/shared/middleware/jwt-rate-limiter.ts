import { createMiddleware } from 'hono/factory';
import { ProtectedEnv } from '../types/hono';
import { rateLimiter } from 'hono-rate-limiter';
import { getRedisClient } from '../infra/redis/client';
import { IoredisStore, WINDOW_MS } from '../infra/redis/ioredis-store';

const JWT_RATE_LIMIT = 1000; // 1000 requests per window

export const jwtRateLimiter = createMiddleware<ProtectedEnv>(async (c, next) => {
  const redisURL = c.get('config').REDIS_URL;
  const redisClient = getRedisClient(redisURL);

  const limiter = rateLimiter<ProtectedEnv>({
    windowMs: WINDOW_MS,
    limit: JWT_RATE_LIMIT,
    standardHeaders: 'draft-6', // Return rate limit info in the `RateLimit-*` headers

    keyGenerator: (c) => {
      const jwtPayload = c.get('jwtPayload');
      return `rate-limit:jwt:${jwtPayload?.sub || 'anonymous'}`; // Use the user ID from the JWT payload as the key
    },

    store: new IoredisStore(redisClient),
  });

  return limiter(c, next);
});
