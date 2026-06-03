import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type AuthHandlerEnv } from '../auth.di';
import { AuthRefreshRequestSchema, AuthRefreshResponseSchema } from '@tracen/contracts';
import { fetchExistingRefreshTokenData, logoutByRefreshToken } from './refresh.usecase';
import { createJWTPayload, createNewRefreshToken } from '../../../features/auth/domain/auth.entity';

export function refreshRouter() {
  return new Hono<AuthHandlerEnv>()
    .post('/', zValidator('json', AuthRefreshRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const authAccessTokenWorker = c.get('authAccessTokenWorker');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      const refreshTokenExpiresIn = c.get('config').REFRESH_TOKEN_EXPIRES_IN;
      try {
        const response = await fetchExistingRefreshTokenData(authRefreshTokenRepository, request);
        if (response && response.userId && response.familyId) {
          const payload = createJWTPayload(response.userId, 'user');
          const accessToken = await authAccessTokenWorker.createJWT(payload);
          const newRefreshToken = createNewRefreshToken(response.userId, response.familyId);
          await authRefreshTokenRepository.saveToken(
            newRefreshToken.token,
            newRefreshToken.data,
            refreshTokenExpiresIn
          );
          const validatedResponse = AuthRefreshResponseSchema.parse({
            accessToken,
            refreshToken: newRefreshToken.token,
          });
          return c.json(validatedResponse, 200);
        }
        // success: false の場合はドメインエラー（例：リフレッシュトークンが無効）→ 401 Unauthorized
        return c.json(response, 401);
      } catch (err) {
        // 予期しないエラー（DB接続エラーなど）→ 500 Internal Server Error
        console.error('Refresh error:', err);
        return c.json(
          {
            success: false,
            message: 'Internal server error',
            user: undefined,
          },
          500
        );
      }
    })
    .delete('/', zValidator('json', AuthRefreshRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');

      try {
        await logoutByRefreshToken(authRefreshTokenRepository, request.refreshToken);
        return c.json({ success: true }, 200);
      } catch (err) {
        console.error('Logout error:', err);
        return c.json(
          {
            success: false,
            message: 'Internal server error',
            user: undefined,
          },
          500
        );
      }
    });
}
