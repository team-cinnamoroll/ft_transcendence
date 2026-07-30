import { z } from 'zod';

import { SeedBodySchema } from './seed';
import { FaceIdSchema } from '../face';
import { FileSchema } from '../../shared/file-metadata';

export const CreateSeedRequestSchema = z
  .object({
    faceId: FaceIdSchema,
    body: SeedBodySchema,
    images: z.array(FileSchema),
  })
  .strict();
export type CreateSeedRequest = z.infer<typeof CreateSeedRequestSchema>;

export const UpdateSeedRequestSchema = z
  .object({
    body: SeedBodySchema,
    images: z.array(FileSchema),
  })
  .strict();
export type UpdateSeedRequest = z.infer<typeof UpdateSeedRequestSchema>;
