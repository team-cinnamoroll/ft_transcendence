import { z } from 'zod';

import { SeedIdSchema, SeedBodySchema } from './seed';
import { FaceIdSchema } from '../face';
import { FileMetadataIdSchema } from '../../shared/file-metadata';
import { UserIdSchema } from '../user';
import {
  SortOrderTypeSchema,
  ListRequestLimitSchema,
  SearchQuerySchema,
  IsoDateTimeStringSchema,
} from '../../shared/primitives';

// CREATE
export const CreateSeedRequestSchema = z
  .object({
    faceId: FaceIdSchema,
    body: SeedBodySchema,
    imageIds: z.array(FileMetadataIdSchema),
  })
  .strict();
export type CreateSeedRequest = z.infer<typeof CreateSeedRequestSchema>;

// UPDATE
export const UpdateSeedRequestSchema = z
  .object({
    body: SeedBodySchema,
    imageIds: z.array(FileMetadataIdSchema),
  })
  .strict();
export type UpdateSeedRequest = z.infer<typeof UpdateSeedRequestSchema>;

// PUT と DELETE のパスパラメータとして使用するため、 seedId のみを持つスキーマを定義
export const SpecifySeedRequestSchema = z.object({
  seedId: SeedIdSchema,
});
export type SpecifySeedRequest = z.infer<typeof SpecifySeedRequestSchema>;

// GET
export const QuerySeedRequestSchema = z.object({
  q: SearchQuerySchema.optional(),
  faceId: FaceIdSchema.optional(),
  userId: UserIdSchema.optional(),
  fromDate: IsoDateTimeStringSchema.optional(),
  toDate: IsoDateTimeStringSchema.optional(),
  order: SortOrderTypeSchema.optional(),
  limit: ListRequestLimitSchema.optional(),
  cursor: SeedIdSchema.optional(),
});
export type QuerySeedRequest = z.infer<typeof QuerySeedRequestSchema>;
