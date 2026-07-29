import pino from 'pino';
import { z } from 'zod';

import { type UserId, type FaceId, UserIdSchema, FaceIdSchema } from '@tracen/contracts';
import {
  type AuthAction,
  type PostAction,
  AuthActionSchema,
  PostActionSchema,
} from '../../core-domain/analytics/analytics-event';
import { makeSafeInfraResult } from './validation';

const AuthEventSchema = z.object({
  category: z.literal('auth'),
  action: AuthActionSchema,
  userId: UserIdSchema,
});

const FaceEventSchema = z.object({
  category: z.literal('face'),
  action: PostActionSchema,
  userId: UserIdSchema,
  faceId: FaceIdSchema, // face の場合は必須
});

const SeedEventSchema = z.object({
  category: z.literal('seed'),
  action: PostActionSchema,
  userId: UserIdSchema,
  faceId: FaceIdSchema, // seed の場合も必須
});

export const AnalyticsEventSchema = z.discriminatedUnion('category', [
  AuthEventSchema,
  FaceEventSchema,
  SeedEventSchema,
]);

const logger = pino({
  level: 'info',
  timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
});

export const yieldAuthEvent = (eventAction: AuthAction, userId: UserId) => {
  const event = makeSafeInfraResult(AnalyticsEventSchema, {
    category: 'auth',
    action: eventAction,
    userId,
  });
  logger.info(event);
};

export const yieldFaceEvent = (eventAction: PostAction, userId: UserId, faceId: FaceId) => {
  const event = makeSafeInfraResult(AnalyticsEventSchema, {
    category: 'face',
    action: eventAction,
    userId,
    faceId,
  });
  logger.info(event);
};

export const yieldSeedEvent = (eventAction: PostAction, userId: UserId, faceId: FaceId) => {
  const event = makeSafeInfraResult(AnalyticsEventSchema, {
    category: 'seed',
    action: eventAction,
    userId,
    faceId,
  });
  logger.info(event);
};
