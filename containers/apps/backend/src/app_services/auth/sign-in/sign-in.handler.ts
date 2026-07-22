import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../../shared/utils/custom-z-validator';

import { type AuthHandlerEnv } from '../auth.di';
import {
  injectFileQueryDeps,
  FileQueryHandlerEnv,
} from '../../../features/file-storage/file.query-service.di';
import { AuthSignInRequestSchema, AuthSignInResponseSchema } from '@tracen/contracts';
import { verifyUser } from './sign-in.verify-user.usecase';
import { makeNewUserTokens } from '../../../features/auth/domain/auth.usecase';
import { getOrCreateUserProfile } from '../../../features/user-profile/domain/user-profile.get-or-create.usecase';
import { UnauthorizedError, ServiceUnavailableError } from '../../../shared/errors/global.error';
import { makeSafeResponse } from '../../../shared/utils/validation';

export function signInRouter() {
  return new Hono<AuthHandlerEnv & FileQueryHandlerEnv>()
    .use('*', injectFileQueryDeps())
    .post('/', cZValidator('json', AuthSignInRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const userRepo = c.get('userRepo');
      const authPassWorker = c.get('authPassWorker');
      const authAccessTokenWorker = c.get('authAccessTokenWorker');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      const userProfileRepo = c.get('userProfileRepo');
      const config = c.get('config');
      const fileQueryService = c.get('fileQueryService');
      try {
        const verifiedUser = await verifyUser(userRepo, authPassWorker, request);
        const userTokens = await makeNewUserTokens(
          authAccessTokenWorker,
          authRefreshTokenRepository,
          config,
          verifiedUser.id
        );
        const { userProfile } = await getOrCreateUserProfile(
          userProfileRepo,
          fileQueryService,
          verifiedUser.id,
          verifiedUser.name
        );
        return c.json(
          makeSafeResponse(AuthSignInResponseSchema, {
            success: true,
            data: {
              accessToken: userTokens.accessToken,
              refreshToken: userTokens.refreshToken,
              user: verifiedUser,
              userProfile,
            },
          }),
          200
        );
      } catch (err) {
        console.error('Error during sign-in:', err);
        if (err instanceof UnauthorizedError) {
          // 認証エラー → 401 Unauthorized
          return c.json(
            makeSafeResponse(AuthSignInResponseSchema, { success: false, message: err.message }),
            401
          );
        }
        // サービス利用不可エラー（例：Redis接続エラー）→ 503 Service Unavailable
        if (err instanceof ServiceUnavailableError) {
          return c.json(
            makeSafeResponse(AuthSignInResponseSchema, {
              success: false,
              message: err.message,
            }),
            503
          );
        }
        throw err; // その他のエラーはグローバルエラーハンドラで処理
      }
    });
}
