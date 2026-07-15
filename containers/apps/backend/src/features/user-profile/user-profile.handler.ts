import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import {
  UserIdParamSchema,
  UserProfileUpsertRequestSchema,
  SimpleApiResponseSchema,
} from '@tracen/contracts';
import { type UserProfileHandlerEnv, injectUserProfileDeps } from './user-profile.di';
import { upsertUserProfile } from './domain/user-profile.upsert.usecase';

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
            SimpleApiResponseSchema.parse({
              success: false,
              message: 'JWT token is invalid or missing',
            }),
            401
          );
        }
        if (jwtPayload.sub !== userId) {
          return c.json(
            SimpleApiResponseSchema.parse({
              success: false,
              message: 'User ID in the request does not match the authenticated user',
            }),
            403
          );
        }
        if (!userId) {
          return c.json(
            SimpleApiResponseSchema.parse({
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
            return c.json(
              SimpleApiResponseSchema.parse({
                success: true,
                message: 'User profile updated successfully',
              }),
              200
            );
          } else {
            return c.json(
              SimpleApiResponseSchema.parse({
                success: true,
                message: 'User profile created successfully',
              }),
              201
            );
          }
        } catch (error) {
          console.error('User profile upsert failed:', error);
          throw error; // グローバルエラーハンドラで処理
        }
      }
    );
}
