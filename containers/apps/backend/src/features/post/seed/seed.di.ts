import type { MiddlewareHandler } from 'hono';

import { ProtectedEnv } from '../../../shared/types/hono';
import { SeedRepositorySpec } from './domain/seed.repository';
import { getSeedRepository } from './infra/seed.repository.di';
import { FaceRepositorySpec } from '../face/domain/face.repository';
import { getFaceRepository } from '../face/infra/face.repository.di';
import { makeSafeResponse } from '../../../shared/utils/validation';
import { type UserId, UserIdSchema, SimpleApiResponseSchema } from '@tracen/contracts';

export type SeedHandlerEnv = ProtectedEnv & {
  Variables: {
    seedRepo: SeedRepositorySpec;
    faceRepo: FaceRepositorySpec;
    requesterId: UserId;
  };
};

export function injectSeedDeps(): MiddlewareHandler<SeedHandlerEnv> {
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
    const seedRepo = getSeedRepository(config.DATABASE_URL);
    if (!seedRepo) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Failed to initialize dependencies',
        }),
        500
      );
    }
    const faceRepo = getFaceRepository(config.DATABASE_URL);
    if (!faceRepo) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Failed to initialize face repository',
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
    c.set('seedRepo', seedRepo);
    c.set('faceRepo', faceRepo);
    c.set('requesterId', requesterId.data);
    await next();
  };
}
