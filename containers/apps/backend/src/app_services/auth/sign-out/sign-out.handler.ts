import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../../shared/utils/custom-z-validator';

import { type ProtectedEnv } from '../../../shared/types/hono';
import { type AuthHandlerEnv, injectAuthDeps } from '../auth.di';
import { AuthSignOutRequestSchema, AuthSignOutResponseSchema } from '@tracen/contracts';
import { signOutWithValidation } from '../sign-out/sign-out.usecase';
import { UnauthorizedError, ServiceUnavailableError } from '../../../shared/errors/global.error';
import { makeSafeResponse } from '../../../shared/utils/validation';
import { yieldAuthEvent } from '../../../shared/utils/analytics';

export function authSignOutRouter() {
  return new Hono<ProtectedEnv & AuthHandlerEnv>()
    .use('*', injectAuthDeps())
    .post('/', cZValidator('json', AuthSignOutRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      try {
        const jwtPayload = c.get('jwtPayload');
        const userId = jwtPayload.sub;
        await signOutWithValidation(authRefreshTokenRepository, request.refreshToken, userId);
        yieldAuthEvent('logout', userId);
        return c.json(makeSafeResponse(AuthSignOutResponseSchema, { success: true }), 200);
      } catch (err) {
        console.error('Error during sign-out:', err);
        if (err instanceof UnauthorizedError) {
          return c.json(
            makeSafeResponse(AuthSignOutResponseSchema, {
              success: false,
              message: err.message,
            }),
            401
          );
        }
        // サービス利用不可エラー（例：Redis接続エラー）→ 503 Service Unavailable
        if (err instanceof ServiceUnavailableError) {
          return c.json(
            makeSafeResponse(AuthSignOutResponseSchema, {
              success: false,
              message: err.message,
            }),
            503
          );
        }
        throw err; // グローバルエラーハンドラーに任せる
      }
    });
}
