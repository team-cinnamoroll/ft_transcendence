import { z } from 'zod';

import { UuidSchema } from '../../shared/primitives';

export const CreateSeedRequestSchema = z
  .object({
    faceId: UuidSchema,
    body: z.string().min(1),
    imageUrls: z.array(z.url()).optional(),
    linkedSeedIds: z.array(UuidSchema).optional(),
  })
  .strict();
export type CreateSeedRequest = z.infer<typeof CreateSeedRequestSchema>;

export const UpdateSeedRequestSchema = z
  .object({
    body: z.string().min(1),
    imageUrls: z.array(z.url()).optional(),
  })
  .strict();
export type UpdateSeedRequest = z.infer<typeof UpdateSeedRequestSchema>;
