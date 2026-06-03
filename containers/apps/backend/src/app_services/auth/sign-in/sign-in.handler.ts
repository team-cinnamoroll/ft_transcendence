import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type AuthHandlerEnv } from '../auth.di';
import { SignInRequestSchema, AuthSignInResponseSchema } from '@tracen/contracts';
import { signIn } from './sign-in.usecase';
import { makeUserTokens } from '../../../features/auth/domain/auth.usecase';

export function signInRouter() {
  return new Hono<AuthHandlerEnv>().post(
    '/',
    zValidator('json', SignInRequestSchema),
    async (c) => {
      const request = c.req.valid('json');
      const userRepo = c.get('userRepo');
      const authPassWorker = c.get('authPassWorker');
      const authAccessTokenWorker = c.get('authAccessTokenWorker');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      const config = c.get('config');
      try {
        const response = await signIn(userRepo, authPassWorker, request);
        if (response.success && response.user) {
          const userTokens = await makeUserTokens(
            authAccessTokenWorker,
            authRefreshTokenRepository,
            config,
            response.user.id
          );
          const validatedResponse = AuthSignInResponseSchema.parse({
            ...response,
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
          });
          return c.json(validatedResponse, 200);
        }
        // success: false の場合はドメインエラー（例：emailまたはパスワードが無効）→ 401 Unauthorized
        return c.json(response, 401);
      } catch (err) {
        // 予期しないエラー（DB接続エラーなど）→ 500 Internal Server Error
        console.error('SignIn error:', err);
        return c.json(
          AuthSignInResponseSchema.parse({
            success: false,
            message: 'Internal server error',
          }),
          500
        );
      }
    }
  );
}
