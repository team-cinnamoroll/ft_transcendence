import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../../shared/utils/custom-z-validator';

import { type AuthHandlerEnv } from '../auth.di';
import {
  AuthRefreshRequestSchema,
  AuthRefreshResponseSchema,
  SimpleApiResponseSchema,
} from '@tracen/contracts';
import { acceptRefreshRequest, logoutByRefreshToken } from './refresh.usecase';
import { refreshUserTokens } from '../../../features/auth/domain/auth.usecase';
import { makeSafeResponse } from '../../../shared/utils/validation';
import { ServiceUnavailableError } from '../../../shared/errors/global.error';

export function refreshRouter() {
  return new Hono<AuthHandlerEnv>()
    .post('/', cZValidator('json', AuthRefreshRequestSchema), async (c) => {
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
          return c.json(
            makeSafeResponse(AuthRefreshResponseSchema, {
              success: true,
              data: {
                accessToken: userTokens.accessToken,
                refreshToken: userTokens.refreshToken,
              },
            }),
            200
          );
        }
        // success: false の場合はドメインエラー（例：リフレッシュトークンが無効）→ 401 Unauthorized
        return c.json(
          makeSafeResponse(AuthRefreshResponseSchema, {
            success: false,
            message: 'Invalid refresh token',
          }),
          401
        );
      } catch (err) {
        console.error('Error during Refresh execution:', err);
        // サービス利用不可エラー（例：Redis接続エラー）→ 503 Service Unavailable
        if (err instanceof ServiceUnavailableError) {
          return c.json(
            makeSafeResponse(AuthRefreshResponseSchema, {
              success: false,
              message: err.message,
            }),
            503
          );
        }
        // 予期しないエラー（DB接続エラーなど）→ 500 Internal Server Error
        throw err; // グローバルエラーハンドラーに任せる
      }
    })
    .delete('/', cZValidator('json', AuthRefreshRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      try {
        await logoutByRefreshToken(authRefreshTokenRepository, request);
        return c.json(
          makeSafeResponse(SimpleApiResponseSchema, {
            success: true,
          }),
          200
        );
      } catch (err) {
        console.error('Error during Refresh Logout execution:', err);
        // サービス利用不可エラー（例：Redis接続エラー）→ 503 Service Unavailable
        if (err instanceof ServiceUnavailableError) {
          return c.json(
            makeSafeResponse(AuthRefreshResponseSchema, {
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
