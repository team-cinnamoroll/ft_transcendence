import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../shared/utils/custom-z-validator';

import { UserIdParamSchema, UserMeResponseSchema, UserNicknameSchema } from '@tracen/contracts';
import { injectUsersDeps } from './users.di';
import { injectFileQueryDeps } from '../file-storage/file.query-service.di';
import { injectUserProfileDeps } from '../user-profile/user-profile.di';
import { deleteUserById, getUserById } from './domain/users.usecase';
import { getOrCreateUserProfile } from '../user-profile/domain/usecases/user-profile.get-or-create.usecase';
import { NotFoundError } from '../../shared/errors/global.error';
import { SimpleApiResponseSchema } from '@tracen/contracts';
import { makeSafeResponse, makeSafeUsecaseResult } from '../../shared/utils/validation';

export function usersRouter() {
  return new Hono()
    .use('*', injectUsersDeps())
    .delete('/:id', cZValidator('param', UserIdParamSchema), async (c) => {
      const { id } = c.req.valid('param');
      const userRepo = c.get('userRepo');
      try {
        const deleted = await deleteUserById(userRepo, id);
        if (!deleted) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: 'user not found',
            }),
            404
          );
        }
        return c.body(null, 204);
      } catch (err) {
        console.error('Error during user deletion:', err);
        throw err; // グローバルエラーハンドラで処理
      }
    })
    .use('*', injectUserProfileDeps())
    .use('*', injectFileQueryDeps())
    .get('/me', async (c) => {
      try {
        const jwtPayload = c.get('jwtPayload');
        const userId = jwtPayload.sub;
        const userRepo = c.get('userRepo');
        const user = await getUserById(userRepo, userId);
        if (!user) {
          throw new NotFoundError('User not found');
        }
        const userProfileRepo = c.get('userProfileRepo');
        const fileQueryService = c.get('fileQueryService');
        const nickname = makeSafeUsecaseResult(UserNicknameSchema, user.name);
        const { userProfile } = await getOrCreateUserProfile(
          userProfileRepo,
          fileQueryService,
          userId,
          nickname
        );
        return c.json(
          makeSafeResponse(UserMeResponseSchema, {
            success: true,
            data: {
              user,
              userProfile,
            },
          }),
          200
        );
      } catch (err) {
        if (err instanceof NotFoundError) {
          return c.json(
            makeSafeResponse(UserMeResponseSchema, {
              success: false,
              message: err.message,
            }),
            404
          );
        }
        throw err; // その他のエラーはグローバルエラーハンドラで処理
      }
    });
}
