import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../../shared/utils/custom-z-validator';

import { injectSeedDeps, type SeedHandlerEnv } from './seed.di';
import { injectSeedQueryDeps } from './seed.query-service.di';
import { injectFileQueryDeps } from '../../file-storage/file.query-service.di';
import { createSeed } from './domain/usecases/seed.create.usecase';
import { updateSeed } from './domain/usecases/seed.update.usecase';
import { deleteSeed } from './domain/usecases/seed.delete.usecase';
import { fetchSeedsByQuery } from './domain/usecases/seed.fetch-seeds.usecase';
import { fetchSeedById } from './domain/usecases/seed.fetch-seed.usecase';
import { NotFoundError, UnauthorizedError } from '../../../shared/errors/global.error';
import {
  CreateSeedRequestSchema,
  UpdateSeedRequestSchema,
  QuerySeedRequestSchema,
  SpecifySeedRequestSchema,
  SeedCreateResponseSchema,
  SeedUpdateResponseSchema,
  SeedListResponseSchema,
  SeedSingleIdResponseSchema,
  SimpleApiResponseSchema,
} from '@tracen/contracts';
import { makeSafeResponse } from '../../../shared/utils/validation';
import { yieldSeedEvent } from '../../../shared/utils/analytics';

export function seedRouter() {
  return new Hono<SeedHandlerEnv>()
    .use('*', injectSeedDeps())
    .use('*', injectFileQueryDeps())
    .post('/', cZValidator('json', CreateSeedRequestSchema), async (c) => {
      const seedRepo = c.get('seedRepo');
      const faceRepo = c.get('faceRepo');
      const fileQueryService = c.get('fileQueryService');
      const requesterId = c.get('requesterId');
      const requestBody = c.req.valid('json');
      try {
        const newSeed = await createSeed(
          seedRepo,
          faceRepo,
          fileQueryService,
          requesterId,
          requestBody
        );
        yieldSeedEvent('created', requesterId, newSeed.id);
        return c.json(
          makeSafeResponse(SeedCreateResponseSchema, {
            success: true,
            data: { seed: newSeed },
          }),
          201
        );
      } catch (err) {
        console.error('Error during seed creation:', err);
        if (err instanceof NotFoundError) {
          return c.json(
            makeSafeResponse(SeedCreateResponseSchema, {
              success: false,
              message: err.message,
            }),
            404
          );
        }
        if (err instanceof UnauthorizedError) {
          return c.json(
            makeSafeResponse(SeedCreateResponseSchema, {
              success: false,
              message: err.message,
            }),
            403
          );
        }
        throw err; // グローバルエラーハンドラーに任せる
      }
    })
    .put(
      '/:seedId',
      cZValidator('param', SpecifySeedRequestSchema),
      cZValidator('json', UpdateSeedRequestSchema),
      async (c) => {
        const seedRepo = c.get('seedRepo');
        const faceRepo = c.get('faceRepo');
        const fileQueryService = c.get('fileQueryService');
        const requesterId = c.get('requesterId');
        const { seedId } = c.req.valid('param');
        const requestBody = c.req.valid('json');
        try {
          const updatedSeed = await updateSeed(
            seedRepo,
            faceRepo,
            fileQueryService,
            requesterId,
            seedId,
            requestBody
          );
          return c.json(
            makeSafeResponse(SeedUpdateResponseSchema, {
              success: true,
              data: { seed: updatedSeed },
            }),
            200
          );
        } catch (err) {
          console.error('Error during seed update:', err);
          if (err instanceof NotFoundError) {
            return c.json(
              makeSafeResponse(SeedUpdateResponseSchema, {
                success: false,
                message: 'Seed not found',
              }),
              404
            );
          }
          if (err instanceof UnauthorizedError) {
            return c.json(
              makeSafeResponse(SeedUpdateResponseSchema, {
                success: false,
                message: 'Unauthorized to update this seed',
              }),
              403
            );
          }
          throw err; // グローバルエラーハンドラーに任せる
        }
      }
    )
    .delete('/:seedId', cZValidator('param', SpecifySeedRequestSchema), async (c) => {
      const seedRepo = c.get('seedRepo');
      const faceRepo = c.get('faceRepo');
      const requesterId = c.get('requesterId');
      const { seedId } = c.req.valid('param');
      try {
        await deleteSeed(seedRepo, faceRepo, requesterId, seedId);
        return c.body(null, 204);
      } catch (err) {
        console.error('Error during seed deletion:', err);
        if (err instanceof NotFoundError) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: 'Seed not found',
            }),
            404
          );
        }
        if (err instanceof UnauthorizedError) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: 'Unauthorized to delete this seed',
            }),
            403
          );
        }
        throw err; // グローバルエラーハンドラーに任せる
      }
    })
    .get('/:seedId', cZValidator('param', SpecifySeedRequestSchema), async (c) => {
      const seedRepo = c.get('seedRepo');
      const fileQueryService = c.get('fileQueryService');
      const { seedId } = c.req.valid('param');
      try {
        const seed = await fetchSeedById(seedRepo, fileQueryService, seedId);
        return c.json(
          makeSafeResponse(SeedSingleIdResponseSchema, {
            success: true,
            data: { seed },
          }),
          200
        );
      } catch (err) {
        console.error('Error fetching seed by ID:', err);
        if (err instanceof NotFoundError) {
          return c.json(
            makeSafeResponse(SeedSingleIdResponseSchema, {
              success: false,
              message: err.message,
            }),
            404
          );
        }
        throw err; // グローバルエラーハンドラーに任せる
      }
    })
    .use('*', injectSeedQueryDeps())
    .get('/', cZValidator('query', QuerySeedRequestSchema), async (c) => {
      const seedQueryService = c.get('seedQueryService');
      const fileQueryService = c.get('fileQueryService');
      const query = c.req.valid('query');
      try {
        const seeds = await fetchSeedsByQuery(seedQueryService, fileQueryService, query);
        return c.json(
          makeSafeResponse(SeedListResponseSchema, {
            success: true,
            data: { seeds },
          }),
          200
        );
      } catch (err) {
        console.error('Error during seed query:', err);
        throw err; // グローバルエラーハンドラーに任せる
      }
    });
}
