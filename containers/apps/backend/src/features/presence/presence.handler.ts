import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../shared/utils/custom-z-validator';

import {
  PresenceStatusRequestSchema,
  PresenceUpdateResponseSchema,
  PresenceStatusResponseSchema,
} from '@tracen/contracts';
import { type PresenceHandlerEnv, injectPresenceDeps } from './presence.di';
import {
  acceptHeartbeatRequest,
  acceptOfflineRequest,
  getOnlineStatuses,
} from './domain/presence.usecase';
import { ValidationError, ServiceUnavailableError } from '../../shared/errors/global.error';
import { makeSafeResponse } from '../../shared/utils/validation';

export function presenceRouter() {
  return new Hono<PresenceHandlerEnv>()
    .use('*', injectPresenceDeps())
    .post('/heartbeat', async (c) => {
      const presenceRepo = c.get('presenceRepo');
      const jwtPayload = c.get('jwtPayload');
      const userId = jwtPayload.sub;
      try {
        await acceptHeartbeatRequest(presenceRepo, userId);
      } catch (err) {
        console.error('Error during heartbeat request:', err);
        if (err instanceof ServiceUnavailableError) {
          return c.json(
            makeSafeResponse(PresenceUpdateResponseSchema, {
              success: false,
              message: err.message,
            }),
            503
          );
        }
        throw err; // グローバルエラーハンドラーに任せる
      }
      return c.json(makeSafeResponse(PresenceUpdateResponseSchema, { success: true }), 200);
    })
    .post('/offline', async (c) => {
      const presenceRepo = c.get('presenceRepo');
      const jwtPayload = c.get('jwtPayload');
      const userId = jwtPayload.sub;
      try {
        await acceptOfflineRequest(presenceRepo, userId);
      } catch (err) {
        console.error('Error during offline request:', err);
        if (err instanceof ServiceUnavailableError) {
          return c.json(
            makeSafeResponse(PresenceUpdateResponseSchema, {
              success: false,
              message: err.message,
            }),
            503
          );
        }
        throw err; // グローバルエラーハンドラーに任せる
      }
      return c.json(makeSafeResponse(PresenceUpdateResponseSchema, { success: true }), 200);
    })
    .post('/status', cZValidator('json', PresenceStatusRequestSchema), async (c) => {
      const presenceRepo = c.get('presenceRepo');
      const { userIds } = c.req.valid('json');
      if (!userIds || !Array.isArray(userIds)) {
        throw new ValidationError('userIds must be an array');
      }
      try {
        const onlineStatuses = await getOnlineStatuses(presenceRepo, userIds);
        return c.json(
          makeSafeResponse(PresenceStatusResponseSchema, {
            success: true,
            data: { onlineStatuses },
          })
        );
      } catch (err) {
        console.error('Error during getting online statuses:', err);
        if (err instanceof ServiceUnavailableError) {
          return c.json(
            makeSafeResponse(PresenceStatusResponseSchema, {
              success: false,
              message: err.message,
            }),
            503
          );
        }
        throw err; // グローバルエラーハンドラーに任せる
      }
    });
}
