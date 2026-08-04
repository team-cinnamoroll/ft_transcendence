import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../../shared/utils/custom-z-validator';

import { injectFaceDeps, type FaceHandlerEnv } from './face.di';
import { injectFaceQueryDeps } from './face.query-service.di';
import { injectFileQueryDeps } from '../../file-storage/file.query-service.di';
import { createFace } from './domain/usecases/face.create.usecase';
import { updateFace } from './domain/usecases/face.update.usecase';
import { deleteFace } from './domain/usecases/face.delete.usecase';
import { fetchSummaryFacesByQuery } from './domain/usecases/face.fetch-summary-faces.usecase';
import { NotFoundError, UnauthorizedError } from '../../../shared/errors/global.error';
import {
  CreateFaceRequestSchema,
  UpdateFaceRequestSchema,
  QueryFaceRequestSchema,
  SpecifyFaceRequestSchema,
  FaceCreateResponseSchema,
  FaceUpdateResponseSchema,
  FaceListResponseSchema,
  SimpleApiResponseSchema,
} from '@tracen/contracts';
import { makeSafeResponse } from '../../../shared/utils/validation';
import { yieldFaceEvent } from '../../../shared/utils/analytics';

export function faceRouter() {
  return new Hono<FaceHandlerEnv>()
    .use('*', injectFaceDeps())
    .use('*', injectFileQueryDeps())
    .post('/', cZValidator('json', CreateFaceRequestSchema), async (c) => {
      const faceRepo = c.get('faceRepo');
      const fileQueryService = c.get('fileQueryService');
      const requesterId = c.get('requesterId');
      const requestBody = c.req.valid('json');
      try {
        const newFace = await createFace(faceRepo, fileQueryService, requesterId, requestBody);

        yieldFaceEvent('created', requesterId, newFace.id);
        return c.json(
          makeSafeResponse(FaceCreateResponseSchema, {
            success: true,
            data: { face: newFace },
          }),
          201
        );
      } catch (err) {
        console.error('Error during face creation:', err);
        throw err; // グローバルエラーハンドラーに任せる
      }
    })
    .put(
      '/:faceId',
      cZValidator('param', SpecifyFaceRequestSchema),
      cZValidator('json', UpdateFaceRequestSchema),
      async (c) => {
        const faceRepo = c.get('faceRepo');
        const requesterId = c.get('requesterId');
        const { faceId } = c.req.valid('param');
        const requestBody = c.req.valid('json');
        try {
          await updateFace(faceRepo, requesterId, faceId, requestBody);
          return c.json(
            makeSafeResponse(FaceUpdateResponseSchema, {
              success: true,
            }),
            200
          );
        } catch (err) {
          console.error('Error during face update:', err);
          if (err instanceof NotFoundError) {
            return c.json(
              makeSafeResponse(FaceUpdateResponseSchema, {
                success: false,
                message: err.message,
              }),
              404
            );
          }
          if (err instanceof UnauthorizedError) {
            return c.json(
              makeSafeResponse(FaceUpdateResponseSchema, {
                success: false,
                message: err.message,
              }),
              403
            );
          }
          throw err; // グローバルエラーハンドラーに任せる
        }
      }
    )
    .delete('/:faceId', cZValidator('param', SpecifyFaceRequestSchema), async (c) => {
      const faceRepo = c.get('faceRepo');
      const requesterId = c.get('requesterId');
      const { faceId } = c.req.valid('param');
      try {
        await deleteFace(faceRepo, requesterId, faceId);
        return c.body(null, 204);
      } catch (err) {
        console.error('Error during face deletion:', err);
        if (err instanceof NotFoundError) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: err.message,
            }),
            404
          );
        }
        if (err instanceof UnauthorizedError) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: err.message,
            }),
            403
          );
        }
        throw err; // グローバルエラーハンドラーに任せる
      }
    })
    .use('*', injectFaceQueryDeps())
    .get('/', cZValidator('query', QueryFaceRequestSchema), async (c) => {
      const faceQueryService = c.get('faceQueryService');
      const fileQueryService = c.get('fileQueryService');
      const query = c.req.valid('query');
      try {
        const faces = await fetchSummaryFacesByQuery(faceQueryService, fileQueryService, query);
        return c.json(
          makeSafeResponse(FaceListResponseSchema, {
            success: true,
            data: { faces },
          }),
          200
        );
      } catch (err) {
        console.error('Error fetching faces:', err);
        throw err; // グローバルエラーハンドラーに任せる
      }
    });
}
