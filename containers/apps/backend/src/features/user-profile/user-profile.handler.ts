import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { UserProfileUpsertRequestSchema, SuccessResponseSchema } from '@tracen/contracts';
import { type UserProfileHandlerEnv, injectUserProfileDeps } from './user-profile.di';
import { upsertUserProfile } from './domain/user-profile.upsert.usecase';

export function userProfileRouter() {
  return new Hono<UserProfileHandlerEnv>()
    .use('*', injectUserProfileDeps())
    .post('/upsert', zValidator('json', UserProfileUpsertRequestSchema), async (c) => {
      const userProfileRepo = c.get('userProfileRepo');
      if (!userProfileRepo) {
        return c.json(
          SuccessResponseSchema.parse({
            success: false,
            message: 'User profile repository is not initialized',
          }),
          500
        );
      }

      const jwtPayload = c.get('jwtPayload');
      const userId = jwtPayload.sub;
      if (!userId) {
        return c.json(
          SuccessResponseSchema.parse({
            success: false,
            message: 'JWT token is invalid: sub (userId) is missing',
          }),
          400
        );
      }
      const parsedRequest = c.req.valid('json');
      try {
        await upsertUserProfile(userProfileRepo, userId, parsedRequest);

        return c.json(
          SuccessResponseSchema.parse({
            success: true,
          }),
          200
        );
      } catch (error) {
        console.error('User profile upsert failed:', error);
        return c.json(
          SuccessResponseSchema.parse({
            success: false,
            message: 'User profile upsert failed',
          }),
          500
        );
      }
    });
}
