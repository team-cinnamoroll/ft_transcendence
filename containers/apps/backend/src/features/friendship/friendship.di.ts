import type { MiddlewareHandler } from 'hono';

import { ProtectedEnv } from '../../shared/types/hono';
import { FriendshipRepositorySpec } from './domain/friendship.repository';
import { getFriendshipRepository } from './infra/friendship.repository.di';
import { makeSafeResponse } from '../../shared/utils/validation';
import { type UserId, UserIdSchema, SimpleApiResponseSchema } from '@tracen/contracts';

export type FriendshipHandlerEnv = ProtectedEnv & {
  Variables: {
    friendshipRepo: FriendshipRepositorySpec;
    requesterId: UserId;
  };
};

export function injectFriendshipDeps(): MiddlewareHandler<FriendshipHandlerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Service Initialization error',
        }),
        500
      );
    }
    const friendshipRepo = getFriendshipRepository(config.DATABASE_URL);
    if (!friendshipRepo) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Failed to initialize dependencies',
        }),
        500
      );
    }
    const jwtPayload = c.get('jwtPayload');
    if (!jwtPayload) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Unauthorized: Missing JWT payload',
        }),
        401
      );
    }
    const requesterId = UserIdSchema.safeParse(jwtPayload.sub);
    if (!requesterId.success) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Unauthorized: Invalid user ID in JWT payload',
        }),
        401
      );
    }
    c.set('friendshipRepo', friendshipRepo);
    c.set('requesterId', requesterId.data);
    await next();
  };
}
