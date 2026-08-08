import type { MiddlewareHandler } from 'hono';

import { AppEnv } from '../../../shared/types/hono';
import { FaceQueryServiceSpec } from './domain/face.query-service';
import { createDrizzleFaceQueryService } from './infra/db/drizzle-face.query-service.impl';

import { getDb } from '../../../shared/infra/db/client';
import { makeSafeResponse } from '../../../shared/utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

function getFaceQueryService(databaseUrl: string): FaceQueryServiceSpec {
  const db = getDb(databaseUrl);
  return createDrizzleFaceQueryService(db);
}

export type FaceQueryHandlerEnv = AppEnv & {
  Variables: {
    faceQueryService: FaceQueryServiceSpec;
  };
};

export function injectFaceQueryDeps(): MiddlewareHandler<FaceQueryHandlerEnv> {
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
    const faceQueryService = getFaceQueryService(config.DATABASE_URL);
    if (!faceQueryService) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Face query service is not initialized',
        }),
        500
      );
    }
    c.set('faceQueryService', faceQueryService);
    await next();
  };
}
