import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type AuthHandlerEnv } from '../auth.di';
import { AuthSignUpRequestSchema, AuthSignUpResponseSchema } from '@tracen/contracts';
import { signUp } from './sign-up.usecase';
import { makeNewUserTokens } from '../../../features/auth/domain/auth.usecase';

export function signUpRouter() {
  return new Hono<AuthHandlerEnv>().post(
    '/',
    zValidator('json', AuthSignUpRequestSchema),
    async (c) => {
      const request = c.req.valid('json');
      const userRepo = c.get('userRepo');
      const authPassWorker = c.get('authPassWorker');
      const authAccessTokenWorker = c.get('authAccessTokenWorker');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      const config = c.get('config');
      try {
        const response = await signUp(userRepo, authPassWorker, request);
        if (response.success && response.user) {
          const userTokens = await makeNewUserTokens(
            authAccessTokenWorker,
            authRefreshTokenRepository,
            config,
            response.user.id
          );
          const validatedResponse = AuthSignUpResponseSchema.parse({
            ...response,
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
          });
          return c.json(validatedResponse, 201);
        }
        // success: false の場合はドメインエラー（例：email重複）→ 409 Conflict
        return c.json(response, 409);
      } catch (err) {
        // 予期しないエラー（DB接続エラーなど）→ 500 Internal Server Error
        console.error('SignUp error:', err);
        return c.json(
          AuthSignUpResponseSchema.parse({
            success: false,
            message: 'Internal server error',
          }),
          500
        );
      }
    }
  );
}
