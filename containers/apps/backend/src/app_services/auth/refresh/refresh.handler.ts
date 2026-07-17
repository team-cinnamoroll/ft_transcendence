import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type AuthHandlerEnv } from '../auth.di';
import { AuthRefreshRequestSchema, AuthRefreshResponseSchema } from '@tracen/contracts';
import { acceptRefreshRequest, logoutByRefreshToken } from './refresh.usecase';
import { refreshUserTokens } from '../../../features/auth/domain/auth.usecase';
import { getUserEntityById } from '../../../features/users/domain/users.usecase';

export function refreshRouter() {
  return new Hono<AuthHandlerEnv>()
    .post('/', zValidator('json', AuthRefreshRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const userRepo = c.get('userRepo');
      const authAccessTokenWorker = c.get('authAccessTokenWorker');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      const config = c.get('config');
      try {
        const response = await acceptRefreshRequest(authRefreshTokenRepository, request);
        if (response && response.userId && response.familyId) {
          // 利用制限: suspended（または削除済み）ユーザーの refresh は拒否し、新トークンを発行しない。
          // access token は最大 TTL(15分)で自然失効する（即時失効は将来の hardening）。
          const user = await getUserEntityById(userRepo, response.userId);
          if (!user || user.status === 'suspended') {
            return c.json(
              AuthRefreshResponseSchema.parse({
                success: false,
                message: 'Invalid refresh token',
              }),
              401
            );
          }
          const userTokens = await refreshUserTokens(
            authAccessTokenWorker,
            authRefreshTokenRepository,
            config,
            request.refreshToken,
            response.userId,
            response.familyId,
            user.role
          );
          const validatedResponse = AuthRefreshResponseSchema.parse({
            success: true,
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
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
          AuthRefreshResponseSchema.parse({
            success: true,
          }),
          200
        );
      } catch (err) {
        console.error('Logout error:', err);
        return c.json(
          AuthRefreshResponseSchema.parse({
            success: false,
            message: 'Internal server error',
          }),
          500
        );
      }
    });
}
