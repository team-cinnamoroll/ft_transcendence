import type { MiddlewareHandler } from 'hono';

import { AppEnv } from '../../../shared/types/hono';
import { AuthPassWorkerSpec } from '../domain/auth.worker';
import { createArgon2AuthPassWorker } from './worker/argon2-auth-pass.worker.impl';
import { AuthAccessTokenWorkerSpec } from '../domain/auth.worker';
import { createHonoJWTAuthTokenWorker } from './worker/hono-jwt-auth-token.worker.impl';

export function getAuthPassWorker(pepper: string): AuthPassWorkerSpec {
  return createArgon2AuthPassWorker(pepper);
}

export function getAuthAccessTokenWorker(jwtSecret: string): AuthAccessTokenWorkerSpec {
  return createHonoJWTAuthTokenWorker(jwtSecret);
}

export type AuthWorkerEnv = AppEnv & {
  Variables: {
    authPassWorker: AuthPassWorkerSpec;
  };
};

export function injectAuthWorkerDeps(): MiddlewareHandler<AuthWorkerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json(
        {
          success: false,
          message: 'Service Initialization error',
        },
        500
      );
    }
    const authPassWorker = getAuthPassWorker(config.PEPPER);
    if (!authPassWorker) {
      return c.json(
        {
          success: false,
          message: 'Failed to initialize dependencies',
        },
        500
      );
    }
    c.set('authPassWorker', authPassWorker);
    await next();
  };
}
