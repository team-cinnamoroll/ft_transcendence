import type { MiddlewareHandler } from 'hono';

import { ProtectedEnv } from '../../../shared/types/hono';
import { UserRepositorySpec } from '../../../features/users/domain/users.repository';
import { getUserRepository } from '../infra/users.repository.di';

export type UsersHandlerEnv = ProtectedEnv & {
  Variables: { userRepo: UserRepositorySpec };
};

export function injectUsersDeps(): MiddlewareHandler<UsersHandlerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json({ message: 'Config is required' }, 500);
    }
    const userRepo = getUserRepository(config.DATABASE_URL);
    c.set('userRepo', userRepo);
    await next();
  };
}
