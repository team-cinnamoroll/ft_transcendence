import type { MiddlewareHandler } from 'hono';

import { ProtectedEnv } from '../../shared/types/hono';
import { UserProfileRepositorySpec } from './domain/user-profile.repository';
import { getUserProfileRepository } from './infra/user-profile.repository.di';
import { makeSafeResponse } from '../../shared/utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

export type UserProfileHandlerEnv = ProtectedEnv & {
  Variables: {
    userProfileRepo: UserProfileRepositorySpec;
  };
};

export function injectUserProfileDeps(): MiddlewareHandler<UserProfileHandlerEnv> {
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
    const userProfileRepo = getUserProfileRepository(config.DATABASE_URL);
    if (!userProfileRepo) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Failed to initialize dependencies',
        }),
        500
      );
    }
    c.set('userProfileRepo', userProfileRepo);
    await next();
  };
}
