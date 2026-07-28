import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../shared/utils/custom-z-validator';

import {
  UserIdParamSchema,
  UserProfileUpsertRequestSchema,
  SimpleApiResponseSchema,
  UserProfilesResponseSchema,
  UserProfileBulkRequestSchema,
  type UserProfileMap,
} from '@tracen/contracts';
import { injectUsersDeps } from '../users/users.di';
import { type UserProfileHandlerEnv, injectUserProfileDeps } from './user-profile.di';
import { injectFileQueryDeps } from '../file-storage/file.query-service.di';
import { injectFriendshipQueryDeps } from '../friendship/friendship.query-service.di';
import { upsertUserProfile } from './domain/usecases/user-profile.upsert.usecase';
import { getUserById } from '../users/domain/users.usecase';
import { getUserProfiles } from './domain/usecases/user-profile.get-or-create.usecase';
import { toUserProfilesWithRelation } from './domain/usecases/user-profile.to-profile-with-reration.usecase';
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
    .use('*', injectFriendshipQueryDeps())
    .get('/profiles', cZValidator('query', UserProfileBulkRequestSchema), async (c) => {
      const userProfileRepo = c.get('userProfileRepo');
      const fileQueryService = c.get('fileQueryService');
      const friendshipQueryService = c.get('friendshipQueryService');
      try {
        const jwtPayload = c.get('jwtPayload');
        const requesterId = jwtPayload.sub;
        const userRepo = c.get('userRepo');
        const user = await getUserById(userRepo, requesterId);
        if (!user) {
          throw new UnauthorizedError('Unauthorized: Invalid user request');
        }
        const { ids } = c.req.valid('query');
        // 重複したIDを取り除く（例: ?ids=usr_1,usr_1 → ["usr_1"]）
        const targetIds = Array.from(new Set(ids));
        const retrievedProfiles = await getUserProfiles(
          userProfileRepo,
          fileQueryService,
          targetIds
        );
        const retrievedProfilesWithRelation = await toUserProfilesWithRelation(
          friendshipQueryService,
          requesterId,
          retrievedProfiles
        );
        const retrievedProfilesWithRelationMap = new Map(
          retrievedProfilesWithRelation.map((profile) => [profile.id, profile])
        );
        const userProfilesWithRelationMap: UserProfileMap = Object.fromEntries(
          targetIds.map((id) => [id, retrievedProfilesWithRelationMap.get(id) || null])
        );
        return c.json(
          makeSafeResponse(UserProfilesResponseSchema, {
            success: true,
            data: { profileMap: userProfilesWithRelationMap },
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
