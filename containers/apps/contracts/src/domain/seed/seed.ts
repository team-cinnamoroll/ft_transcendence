import { z } from 'zod';

import { IsoDateTimeStringSchema, UuidSchema } from '../../shared/primitives';

export const SeedIdSchema = UuidSchema;
export type SeedId = z.infer<typeof SeedIdSchema>;

export const SeedResponseSchema = z
  .object({
    id: SeedIdSchema,
    faceId: UuidSchema,
    userId: UuidSchema,
    body: z.string(),
    imageUrls: z.array(z.url()).optional(),
    linkedSeedIds: z.array(UuidSchema).optional(),
    createdAt: IsoDateTimeStringSchema,
  })
  .strict();
export type SeedResponse = z.infer<typeof SeedResponseSchema>;
