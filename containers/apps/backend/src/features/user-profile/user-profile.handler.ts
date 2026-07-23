import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../shared/utils/custom-z-validator';

import {
  UserIdParamSchema,
  UserProfileUpsertRequestSchema,
  SimpleApiResponseSchema,
} from '@tracen/contracts';
import { type UserProfileHandlerEnv, injectUserProfileDeps } from './user-profile.di';
import { upsertUserProfile } from './domain/user-profile.upsert.usecase';
import { NotFoundError } from '../../shared/errors/global.error';
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
    );
}
