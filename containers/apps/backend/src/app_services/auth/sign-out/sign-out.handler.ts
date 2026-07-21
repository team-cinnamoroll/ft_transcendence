import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type ProtectedEnv } from '../../../shared/types/hono';
import { type AuthHandlerEnv, injectAuthDeps } from '../auth.di';
import { AuthSignOutRequestSchema, AuthSignOutResponseSchema } from '@tracen/contracts';
import { signOutWithValidation } from '../sign-out/sign-out.usecase';
import { ValidationError } from '../../../shared/errors/global.error';
import { ZodError } from 'zod';
import { makeSafeResponse } from '../../../shared/utils/validation';

export function authSignOutRouter() {
  return new Hono<ProtectedEnv & AuthHandlerEnv>()
    .use('*', injectAuthDeps())
    .post('/', zValidator('json', AuthSignOutRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      try {
        const jwtPayload = c.get('jwtPayload');
        const userId = jwtPayload.sub;
        if (!userId) {
          throw new ValidationError('JWT token is invalid: sub (userId) is missing');
        }
        await signOutWithValidation(authRefreshTokenRepository, request.refreshToken, userId);
        return c.json(makeSafeResponse(AuthSignOutResponseSchema, { success: true }), 200);
      } catch (error) {
        console.error('Error during sign-out:', error);
        if (error instanceof ValidationError) {
          return c.json(
            makeSafeResponse(AuthSignOutResponseSchema, {
              success: false,
              message: error.message,
            }),
            400
          );
        }
        if (error instanceof ZodError) {
          return c.json(
            makeSafeResponse(AuthSignOutResponseSchema, {
              success: false,
              message: 'Invalid request data',
            }),
            400
          );
        }
        throw error; // グローバルエラーハンドラーに任せる
      }
    });
}
