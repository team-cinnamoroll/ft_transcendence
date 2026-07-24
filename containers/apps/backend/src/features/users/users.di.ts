import type { MiddlewareHandler } from 'hono';

import { ProtectedEnv } from '../../shared/types/hono';
import { UserRepositorySpec } from './domain/users.repository';
import { getUserRepository } from './infra/users.repository.di';
import { makeSafeResponse } from '../../shared/utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

export type UsersHandlerEnv = ProtectedEnv & {
  Variables: { userRepo: UserRepositorySpec };
};

export function injectUsersDeps(): MiddlewareHandler<UsersHandlerEnv> {
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
    const userRepo = getUserRepository(config.DATABASE_URL);
    if (!userRepo) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Failed to initialize dependencies',
        }),
        500
      );
    }
    c.set('userRepo', userRepo);
    await next();
  };
}
