import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

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
import { makeSafeResponse } from '../../shared/utils/validation';

export function presenceRouter() {
  return new Hono<PresenceHandlerEnv>()
    .use('*', injectPresenceDeps())
    .post('/heartbeat', async (c) => {
      const presenceRepo = c.get('presenceRepo');
      const jwtPayload = c.get('jwtPayload');
      const userId = jwtPayload.sub;
      if (!userId) {
        return c.json(
          makeSafeResponse(PresenceUpdateResponseSchema, {
            success: false,
            message: 'JWT token is invalid: sub (userId) is missing',
          }),
          400
        );
      }
      try {
        await acceptHeartbeatRequest(presenceRepo, userId);
      } catch (err) {
        console.error('Error accepting heartbeat request:', err);
        return c.json(
          makeSafeResponse(PresenceUpdateResponseSchema, {
            success: false,
            message: 'Failed to process heartbeat request',
          }),
          500
        );
      }
      return c.json(makeSafeResponse(PresenceUpdateResponseSchema, { success: true }), 200);
    })
    .post('/offline', async (c) => {
      const presenceRepo = c.get('presenceRepo');
      const jwtPayload = c.get('jwtPayload');
      const userId = jwtPayload.sub;
      if (!userId) {
        return c.json(
          makeSafeResponse(PresenceUpdateResponseSchema, {
            success: false,
            message: 'JWT token is invalid: sub (userId) is missing',
          }),
          400
        );
      }
      try {
        await acceptOfflineRequest(presenceRepo, userId);
      } catch (err) {
        console.error('Error accepting offline request:', err);
        return c.json(
          makeSafeResponse(PresenceUpdateResponseSchema, {
            success: false,
            message: 'Failed to process offline request',
          }),
          500
        );
      }
      return c.json(makeSafeResponse(PresenceUpdateResponseSchema, { success: true }), 200);
    })
    .post('/status', zValidator('json', PresenceStatusRequestSchema), async (c) => {
      const presenceRepo = c.get('presenceRepo');
      const { userIds } = c.req.valid('json');
      if (!userIds || !Array.isArray(userIds)) {
        return c.json(
          makeSafeResponse(PresenceStatusResponseSchema, {
            success: false,
            message: 'userIds must be an array',
          }),
          400
        );
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
        console.error('Error getting online statuses:', err);
        return c.json(
          makeSafeResponse(PresenceStatusResponseSchema, {
            success: false,
            message: 'Failed to get online statuses',
          }),
          500
        );
      }
    });
}
