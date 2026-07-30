import { z } from 'zod';

import { UserIdSchema } from '../user';
import { FaceIdSchema } from '../face';
import { FileSchema } from '../../shared/file-metadata';
import { IsoDateTimeStringSchema, UuidSchema } from '../../shared/primitives';
import { createApiResponseSchema } from '../../shared/response';

export const SeedIdSchema = UuidSchema;
export type SeedId = z.infer<typeof SeedIdSchema>;

export const SeedBodySchema = z.string().min(1).max(1000);
export type SeedBody = z.infer<typeof SeedBodySchema>;

export const SeedSchema = z
  .object({
    id: SeedIdSchema,
    faceId: FaceIdSchema,
    userId: UserIdSchema,
    body: SeedBodySchema,
    images: z.array(FileSchema),
    createdAt: IsoDateTimeStringSchema,
    updatedAt: IsoDateTimeStringSchema,
  })
  .strict();
export type Seed = z.infer<typeof SeedSchema>;

export const SeedResponseSchema = createApiResponseSchema(SeedSchema);
export type SeedResponse = z.infer<typeof SeedResponseSchema>;
