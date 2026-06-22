import type { MiddlewareHandler } from 'hono';

import { ProtectedEnv } from '../../shared/types/hono';
import type { PresenceRepositorySpec } from './domain/presence.repository';
import { getPresenceRepository } from './infra/presence.repository.di';

export type PresenceHandlerEnv = ProtectedEnv & {
  Variables: {
    presenceRepo: PresenceRepositorySpec;
  };
};

export function injectPresenceDeps(): MiddlewareHandler<PresenceHandlerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json({ message: 'Config is required' }, 500);
    }
    const presenceRepo = getPresenceRepository(config.REDIS_URL);
    c.set('presenceRepo', presenceRepo);
    await next();
  };
}
