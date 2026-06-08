import { z } from 'zod';

import { IsoDateTimeStringSchema, UuidSchema } from '../../shared/primitives';

export const NotificationResponseSchema = z.discriminatedUnion('type', [
  z
    .object({
      id: UuidSchema,
      type: z.literal('link'),
      fromUserId: UuidSchema,
      seedId: UuidSchema,
      createdAt: IsoDateTimeStringSchema,
    })
    .strict(),
  z
    .object({
      id: UuidSchema,
      type: z.literal('subscribe'),
      fromUserId: UuidSchema,
      faceId: UuidSchema,
      createdAt: IsoDateTimeStringSchema,
    })
    .strict(),
]);
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
