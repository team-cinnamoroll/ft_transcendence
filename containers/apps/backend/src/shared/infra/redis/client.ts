import { Redis } from 'ioredis';

type GlobalRedisCache = {
  __redisClient?: Redis;
  __redisUrl?: string;
};

const globalCache = globalThis as unknown as GlobalRedisCache;

export type RedisClient = Redis;

export function getRedisClient(redisUrl: string): Redis {
  if (globalCache.__redisClient && globalCache.__redisUrl === redisUrl) {
    return globalCache.__redisClient;
  }

  const client = new Redis(redisUrl);
  client.on('error', (err) => console.error('Redis Client Error', err));
  client.on('connect', () => console.log('Successfully connected to Redis!'));

  globalCache.__redisClient = client;
  globalCache.__redisUrl = redisUrl;

  return client;
}
