import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type AuthHandlerEnv } from '../auth.di';
import {
  AuthRefreshRequestSchema,
  AuthRefreshResponseSchema,
  SimpleApiResponseSchema,
} from '@tracen/contracts';
import { acceptRefreshRequest, logoutByRefreshToken } from './refresh.usecase';
import { refreshUserTokens } from '../../../features/auth/domain/auth.usecase';

export function refreshRouter() {
  return new Hono<AuthHandlerEnv>()
    .post('/', zValidator('json', AuthRefreshRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const authAccessTokenWorker = c.get('authAccessTokenWorker');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      const config = c.get('config');
      try {
        const response = await acceptRefreshRequest(authRefreshTokenRepository, request);
        if (response && response.userId && response.familyId) {
          const userTokens = await refreshUserTokens(
            authAccessTokenWorker,
            authRefreshTokenRepository,
            config,
            request.refreshToken,
            response.userId,
            response.familyId
          );
          const validatedResponse = AuthRefreshResponseSchema.parse({
            success: true,
            data: {
              accessToken: userTokens.accessToken,
              refreshToken: userTokens.refreshToken,
            },
          });
          return c.json(validatedResponse, 200);
        }
        // success: false の場合はドメインエラー（例：リフレッシュトークンが無効）→ 401 Unauthorized
        return c.json(
          AuthRefreshResponseSchema.parse({
            success: false,
            message: 'Invalid refresh token',
          }),
          401
        );
      } catch (err) {
        // 予期しないエラー（DB接続エラーなど）→ 500 Internal Server Error
        console.error('Refresh error:', err);
        return c.json(
          AuthRefreshResponseSchema.parse({
            success: false,
            message: 'Internal server error',
          }),
          500
        );
      }
    })
    .delete('/', zValidator('json', AuthRefreshRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');

      try {
        await logoutByRefreshToken(authRefreshTokenRepository, request.refreshToken);
        return c.json(
          SimpleApiResponseSchema.parse({
            success: true,
          }),
          200
        );
      } catch (err) {
        console.error('Logout error:', err);
        return c.json(
          SimpleApiResponseSchema.parse({
            success: false,
            message: 'Internal server error',
          }),
          500
        );
      }
    });
}
