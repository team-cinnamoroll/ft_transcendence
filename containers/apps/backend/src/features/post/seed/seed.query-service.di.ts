import type { MiddlewareHandler } from 'hono';

import { AppEnv } from '../../../shared/types/hono';
import { SeedQueryServiceSpec } from './domain/seed.query-service';
import { createDrizzleSeedQueryService } from './infra/db/drizzle-seed.query-service.impl';

import { getDb } from '../../../shared/infra/db/client';
import { makeSafeResponse } from '../../../shared/utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

function getSeedQueryService(databaseUrl: string): SeedQueryServiceSpec {
  const db = getDb(databaseUrl);
  return createDrizzleSeedQueryService(db);
}

export type SeedQueryHandlerEnv = AppEnv & {
  Variables: {
    seedQueryService: SeedQueryServiceSpec;
  };
};

export function injectSeedQueryDeps(): MiddlewareHandler<SeedQueryHandlerEnv> {
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
    const seedQueryService = getSeedQueryService(config.DATABASE_URL);
    if (!seedQueryService) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Seed query service is not initialized',
        }),
        500
      );
    }
    c.set('seedQueryService', seedQueryService);
    await next();
  };
}
