import { z } from 'zod';

import { UuidSchema } from '../../shared/primitives';

export const FaceIdSchema = UuidSchema;
export type FaceId = z.infer<typeof FaceIdSchema>;

export const FaceResponseSchema = z
  .object({
    id: FaceIdSchema,
    userId: UuidSchema,
    name: z.string().min(1),
    emoji: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.url().optional(),
    isPrivate: z.boolean(),
  })
  .strict();
export type FaceResponse = z.infer<typeof FaceResponseSchema>;
