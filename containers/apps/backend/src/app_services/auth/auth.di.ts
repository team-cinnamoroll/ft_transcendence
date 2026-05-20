import type { MiddlewareHandler } from 'hono';

import { AppEnv } from '../../shared/types/hono';
import { UserRepositorySpec } from '../../features/users/domain/users.repository';
import type {
  AuthPassWorkerSpec,
  AuthTokenWorkerSpec,
} from '../../features/auth/domain/auth.worker';
import { getUserRepository } from '../../features/users/infra/users.repository.di';
import { getAuthPassWorker, getAuthTokenWorker } from '../../features/auth/infra/auth.worker.di';

export type AuthHandlerEnv = AppEnv & {
  Variables: {
    userRepo: UserRepositorySpec;
    authPassWorker: AuthPassWorkerSpec;
    authTokenWorker: AuthTokenWorkerSpec;
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
    const authTokenWorker = getAuthTokenWorker(config.JWT_SECRET);
    c.set('userRepo', userRepo);
    c.set('authPassWorker', authPassWorker);
    c.set('authTokenWorker', authTokenWorker);
    await next();
  };
}
