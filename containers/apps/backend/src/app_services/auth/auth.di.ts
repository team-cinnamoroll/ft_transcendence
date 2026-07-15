import type { MiddlewareHandler } from 'hono';

import { AppEnv } from '../../shared/types/hono';
import type { UserRepositorySpec } from '../../features/users/domain/users.repository';
import { getUserRepository } from '../../features/users/infra/users.repository.di';
import type { UserProfileRepositorySpec } from '../../features/user-profile/domain/user-profile.repository';
import { getUserProfileRepository } from '../../features/user-profile/infra/user-profile.repository.di';
import type {
  AuthPassWorkerSpec,
  AuthAccessTokenWorkerSpec,
} from '../../features/auth/domain/auth.worker';

import {
  getAuthPassWorker,
  getAuthAccessTokenWorker,
} from '../../features/auth/infra/auth.worker.di';
import type { AuthRefreshTokenRepositorySpec } from '../../features/auth/domain/auth.repository';
import { getAuthRefreshTokenRepository } from '../../features/auth/infra/auth.repository.di';

export type AuthHandlerEnv = AppEnv & {
  Variables: {
    userRepo: UserRepositorySpec;
    userProfileRepo: UserProfileRepositorySpec;
    authPassWorker: AuthPassWorkerSpec;
    authAccessTokenWorker: AuthAccessTokenWorkerSpec;
    authRefreshTokenRepository: AuthRefreshTokenRepositorySpec;
  };
};

export function injectAuthDeps(): MiddlewareHandler<AuthHandlerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json({ message: 'Config is required' }, 500);
    }
    const userRepo = getUserRepository(config.DATABASE_URL);
    const authPassWorker = getAuthPassWorker(config.PEPPER);
    const authAccessTokenWorker = getAuthAccessTokenWorker(config.JWT_PRIVATE_KEY_PEM);
    c.set('userRepo', userRepo);
    c.set('authPassWorker', authPassWorker);
    c.set('authAccessTokenWorker', authAccessTokenWorker);
    c.set('authRefreshTokenRepository', getAuthRefreshTokenRepository(config.REDIS_URL));
    c.set('userProfileRepo', getUserProfileRepository(config.DATABASE_URL));
    await next();
  };
}
