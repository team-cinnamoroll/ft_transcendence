import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../shared/utils/custom-z-validator';

import {
  UserIdParamSchema,
  UserProfileUpsertRequestSchema,
  SimpleApiResponseSchema,
  UserProfilesResponseSchema,
  type UserProfileMap,
} from '@tracen/contracts';
import { UserProfileBulkQuerySchema } from './domain/user-profile.bulk.query';
import { injectUsersDeps } from '../users/users.di';
import { type UserProfileHandlerEnv, injectUserProfileDeps } from './user-profile.di';
import { injectFileQueryDeps } from '../file-storage/file.query-service.di';
import { upsertUserProfile } from './domain/user-profile.upsert.usecase';
import { getUserById } from '../users/domain/users.usecase';
import { getUserProfiles } from './domain/user-profile.get-or-create.usecase';
import { NotFoundError, UnauthorizedError } from '../../shared/errors/global.error';
import { makeSafeResponse } from '../../shared/utils/validation';

export function userProfileRouter() {
  return new Hono<UserProfileHandlerEnv>()
    .use('*', injectUserProfileDeps())
    .put(
      '/:userId',
      cZValidator('param', UserIdParamSchema),
      cZValidator('json', UserProfileUpsertRequestSchema),
      async (c) => {
        const userProfileRepo = c.get('userProfileRepo');
        const { id: userId } = c.req.valid('param');
        const jwtPayload = c.get('jwtPayload');
        if (jwtPayload.sub !== userId) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: 'Forbidden: You can only update your own profile',
            }),
            403
          );
        }
        const parsedRequest = c.req.valid('json');
        try {
          const result = await upsertUserProfile(userProfileRepo, userId, parsedRequest);

          if (result.isExisted) {
            return c.json(makeSafeResponse(SimpleApiResponseSchema, { success: true }), 200);
          } else {
            return c.json(makeSafeResponse(SimpleApiResponseSchema, { success: true }), 201);
          }
        } catch (err) {
          console.error('Error during User profile upsert:', err);
          if (err instanceof NotFoundError) {
            return c.json(
              makeSafeResponse(SimpleApiResponseSchema, {
                success: false,
                message: err.message,
              }),
              404
            );
          }
          throw err; // グローバルエラーハンドラで処理
        }
      }
    )
    .use('*', injectFileQueryDeps())
    .use('*', injectUsersDeps())
    .get('/profiles', cZValidator('query', UserProfileBulkQuerySchema), async (c) => {
      const userProfileRepo = c.get('userProfileRepo');
      const fileQueryService = c.get('fileQueryService');
      try {
        const jwtPayload = c.get('jwtPayload');
        const userId = jwtPayload.sub;
        const userRepo = c.get('userRepo');
        const user = await getUserById(userRepo, userId);
        if (!user) {
          throw new UnauthorizedError('Unauthorized: Invalid user request');
        }
        const { ids } = c.req.valid('query');
        // 重複したIDを取り除く（例: ?ids=usr_1,usr_1 → ["usr_1"]）
        const uniqueIds = Array.from(new Set(ids));
        const userProfiles = await getUserProfiles(userProfileRepo, fileQueryService, uniqueIds);
        const userProfilesMap = new Map(userProfiles.map((profile) => [profile.id, profile]));
        const profiles: UserProfileMap = Object.fromEntries(
          uniqueIds.map((id) => [id, userProfilesMap.get(id) || null])
        );
        return c.json(
          makeSafeResponse(UserProfilesResponseSchema, {
            success: true,
            data: { profiles },
          }),
          200
        );
      } catch (err) {
        console.error('Error during bulk user profile retrieval:', err);
        if (err instanceof UnauthorizedError) {
          return c.json(
            makeSafeResponse(UserProfilesResponseSchema, {
              success: false,
              message: err.message,
            }),
            401
          );
        }
        throw err; // グローバルエラーハンドラで処理
      }
    });
}
