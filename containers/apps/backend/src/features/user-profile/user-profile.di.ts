import type { MiddlewareHandler } from 'hono';

import { ProtectedEnv } from '../../shared/types/hono';
import { UserProfileRepositorySpec } from './domain/user-profile.repository';
import { getUserProfileRepository } from './infra/user-profile.repository.di';

export type UserProfileHandlerEnv = ProtectedEnv & {
  Variables: {
    userProfileRepo: UserProfileRepositorySpec;
  };
};

export function injectUserProfileDeps(): MiddlewareHandler<UserProfileHandlerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json({ message: 'Config is required' }, 500);
    }
    const userProfileRepo = getUserProfileRepository(config.DATABASE_URL);
    if (!userProfileRepo) {
      return c.json({ message: 'User profile repository is not initialized' }, 500);
    }
    c.set('userProfileRepo', userProfileRepo);
    await next();
  };
}
