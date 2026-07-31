import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../../shared/utils/custom-z-validator';

import { type AuthHandlerEnv } from '../auth.di';
import {
  injectFileQueryDeps,
  FileQueryHandlerEnv,
} from '../../../features/file-storage/file.query-service.di';
import {
  AuthSignUpRequestSchema,
  AuthSignUpResponseSchema,
  UserNicknameSchema,
} from '@tracen/contracts';
import { registerUser } from './sign-up.register-user.usecase';
import { makeNewUserTokens } from '../../../features/auth/domain/auth.usecase';
import { createInitialUserProfile } from '../../../features/user-profile/domain/usecases/user-profile.create-init.usecase';
import { ServiceUnavailableError } from '../../../shared/errors/global.error';
import {
  EmailAlreadyExistsError,
  UserAlreadyExistsError,
} from '../../../features/users/domain/users.error';
import { makeSafeResponse, makeSafeUsecaseResult } from '../../../shared/utils/validation';
import { yieldAuthEvent } from '../../../shared/utils/analytics';

export function signUpRouter() {
  return new Hono<AuthHandlerEnv & FileQueryHandlerEnv>()
    .use('*', injectFileQueryDeps())
    .post('/', cZValidator('json', AuthSignUpRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const userRepo = c.get('userRepo');
      const userProfileRepo = c.get('userProfileRepo');
      const authPassWorker = c.get('authPassWorker');
      const authAccessTokenWorker = c.get('authAccessTokenWorker');
      const authRefreshTokenRepository = c.get('authRefreshTokenRepository');
      const config = c.get('config');
      const fileQueryService = c.get('fileQueryService');
      try {
        const registeredUser = await registerUser(userRepo, authPassWorker, request);
        const userTokens = await makeNewUserTokens(
          authAccessTokenWorker,
          authRefreshTokenRepository,
          config,
          registeredUser.id
        );
        const nickname = makeSafeUsecaseResult(UserNicknameSchema, registeredUser.name);
        const userProfile = await createInitialUserProfile(
          userProfileRepo,
          fileQueryService,
          registeredUser.id,
          nickname
        );
        yieldAuthEvent('signup', registeredUser.id);
        return c.json(
          makeSafeResponse(AuthSignUpResponseSchema, {
            success: true,
            data: {
              accessToken: userTokens.accessToken,
              refreshToken: userTokens.refreshToken,
              user: registeredUser,
              userProfile,
            },
          }),
          201
        );
      } catch (err) {
        console.error('Error during sign-up:', err);
        // 重複エラー（例：email重複）→ 409 Conflict
        if (err instanceof EmailAlreadyExistsError || err instanceof UserAlreadyExistsError) {
          return c.json(
            makeSafeResponse(AuthSignUpResponseSchema, {
              success: false,
              message: err.message,
            }),
            409
          );
        }
        // サービス利用不可エラー（例：Redis接続エラー）→ 503 Service Unavailable
        if (err instanceof ServiceUnavailableError) {
          return c.json(
            makeSafeResponse(AuthSignUpResponseSchema, {
              success: false,
              message: err.message,
            }),
            503
          );
        }

        // 予期しないエラー（DB接続エラーなど）→ 500 Internal Server Error
        throw err; // global error handler に任せる
      }
    });
}
