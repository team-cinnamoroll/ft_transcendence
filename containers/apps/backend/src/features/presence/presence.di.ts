import type { MiddlewareHandler } from 'hono';

import { ProtectedEnv } from '../../shared/types/hono';
import type { PresenceRepositorySpec } from './domain/presence.repository';
import { getPresenceRepository } from './infra/presence.repository.di';
import { makeSafeResponse } from '../../shared/utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

export type PresenceHandlerEnv = ProtectedEnv & {
  Variables: {
    presenceRepo: PresenceRepositorySpec;
  };
};

export function injectPresenceDeps(): MiddlewareHandler<PresenceHandlerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Service Initialization error',
        }),
        500
      );
    }
    const presenceRepo = getPresenceRepository(config.REDIS_URL);
    if (!presenceRepo) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Failed to initialize dependencies',
        }),
        500
      );
    }
    c.set('presenceRepo', presenceRepo);
    await next();
  };
}
