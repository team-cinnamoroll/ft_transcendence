import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import {
  UserIdParamSchema,
  UserProfileUpsertRequestSchema,
  SimpleApiResponseSchema,
} from '@tracen/contracts';
import { type UserProfileHandlerEnv, injectUserProfileDeps } from './user-profile.di';
import { upsertUserProfile } from './domain/user-profile.upsert.usecase';
import { makeSafeResponse } from '../../shared/utils/validation';

export function userProfileRouter() {
  return new Hono<UserProfileHandlerEnv>()
    .use('*', injectUserProfileDeps())
    .put(
      '/:userId',
      zValidator('param', UserIdParamSchema),
      zValidator('json', UserProfileUpsertRequestSchema),
      async (c) => {
        const userProfileRepo = c.get('userProfileRepo');
        const { id: userId } = c.req.valid('param');
        const jwtPayload = c.get('jwtPayload');
        if (!jwtPayload || !jwtPayload.sub) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: 'JWT token is invalid or missing',
            }),
            401
          );
        }
        if (jwtPayload.sub !== userId) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: 'User ID in the request does not match the authenticated user',
            }),
            403
          );
        }
        if (!userId) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: 'JWT token is invalid: sub (userId) is missing',
            }),
            400
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
          console.error('User profile upsert failed:', err);
          throw err; // グローバルエラーハンドラで処理
        }
      }
    );
}
