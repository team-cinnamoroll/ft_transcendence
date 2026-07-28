import type { MiddlewareHandler } from 'hono';

import { AppEnv } from '../../shared/types/hono';
import { FriendshipQueryServiceSpec } from '../../core-domain/friendship/friendship.query-service';
import { createDrizzleFriendshipQueryService } from './infra/db/drizzle-friendship.query-service.impl';

import { getDb } from '../../shared/infra/db/client';
import { makeSafeResponse } from '../../shared/utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

function getFriendshipQueryService(databaseUrl: string): FriendshipQueryServiceSpec {
  const db = getDb(databaseUrl);
  return createDrizzleFriendshipQueryService(db);
}

export type FriendshipQueryHandlerEnv = AppEnv & {
  Variables: {
    friendshipQueryService: FriendshipQueryServiceSpec;
  };
};

export function injectFriendshipQueryDeps(): MiddlewareHandler<FriendshipQueryHandlerEnv> {
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
    const friendshipQueryService = getFriendshipQueryService(config.DATABASE_URL);
    if (!friendshipQueryService) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Friendship query service is not initialized',
        }),
        500
      );
    }
    c.set('friendshipQueryService', friendshipQueryService);
    await next();
  };
}
