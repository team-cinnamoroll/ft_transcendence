import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type AuthHandlerEnv } from '../auth.di';
import { SignInRequestSchema, AuthSignInResponseSchema } from '@tracen/contracts';
import { signIn } from './sign-in.usecase';
import { createJWTPayload, createNewRefreshToken } from '../../../features/auth/domain/auth.entity';

// handlerでは入力に対してのバリデーションしかしない。出力のバリデーションはドメイン層で行う。

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
      const refreshTokenExpiresIn = c.get('config').REFRESH_TOKEN_EXPIRES_IN;
      try {
        const response = await signIn(userRepo, authPassWorker, request);
        if (response.success && response.user) {
          const payload = createJWTPayload(response.user.id, 'user');
          const accessToken = await authAccessTokenWorker.createJWT(payload);
          const refreshToken = createNewRefreshToken(response.user.id);
          await authRefreshTokenRepository.saveToken(
            refreshToken.token,
            refreshToken.data,
            refreshTokenExpiresIn
          );
          const validatedResponse = AuthSignInResponseSchema.parse({
            ...response,
            accessToken,
            refreshToken: refreshToken.token,
          });
          return c.json(validatedResponse, 200);
        }
        // success: false の場合はドメインエラー（例：emailまたはパスワードが無効）→ 401 Unauthorized
        return c.json(response, 401);
      } catch (err) {
        // 予期しないエラー（DB接続エラーなど）→ 500 Internal Server Error
        console.error('SignIn error:', err);
        return c.json(
          {
            success: false,
            message: 'Internal server error',
            user: undefined,
          },
          500
        );
      }
    }
  );
}
