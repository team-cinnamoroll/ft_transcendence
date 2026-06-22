import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type ProtectedEnv } from '../../../shared/types/hono';
import { type AuthHandlerEnv, injectAuthDeps } from '../auth.di';
import { AuthSignOutRequestSchema, AuthSignOutResponseSchema } from '@tracen/contracts';
import { signOutWithValidation } from '../sign-out/sign-out.usecase';

export function authSignOutRouter() {
  return new Hono<ProtectedEnv & AuthHandlerEnv>()
    .use('*', injectAuthDeps())
    .post('/', zValidator('json', AuthSignOutRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');

      const jwtPayload = c.get('jwtPayload');
      const userId = jwtPayload.sub;
      if (!userId) {
        return c.json(
          AuthSignOutResponseSchema.parse({
            message: 'JWT token is invalid: sub (userId) is missing',
          }),
          400
        );
      }

      try {
        const response = await signOutWithValidation(
          authRefreshTokenRepository,
          request.refreshToken,
          userId
        );
        if (!response.success) {
          return c.json(AuthSignOutResponseSchema.parse(response), 400);
        }
        return c.json(AuthSignOutResponseSchema.parse({ success: true }), 200);
      } catch (error) {
        console.error('Error during sign-out:', error);
        return c.json(
          AuthSignOutResponseSchema.parse({ message: 'An error occurred during sign-out' }),
          500
        );
      }
    });
}
