import { z } from 'zod';
import { FaceIdSchema, FaceNameSchema, FaceDescriptionSchema, FaceEmojiSchema } from './face';
import { FileMetadataIdSchema } from '../../shared/file-metadata';
import { UserIdSchema } from '../user';
import {
  VisibilityStatusSchema,
  SortOrderTypeSchema,
  ListRequestLimitSchema,
  SearchQuerySchema,
} from '../../shared/primitives';

const FaceRequestBaseSchema = z.object({
  name: FaceNameSchema,
  emoji: FaceEmojiSchema.nullable(),
  description: FaceDescriptionSchema.nullable(),
  imageId: FileMetadataIdSchema.nullable(),
  visibility: VisibilityStatusSchema,
});

// CREATE
export const CreateFaceRequestSchema = FaceRequestBaseSchema.strict();
export type CreateFaceRequest = z.infer<typeof CreateFaceRequestSchema>;

// UPDATE
export const UpdateFaceRequestSchema = FaceRequestBaseSchema.omit({ visibility: true }).strict();
export type UpdateFaceRequest = z.infer<typeof UpdateFaceRequestSchema>;

// PUT と DELETE のパスパラメータとして使用するため、faceId のみを持つスキーマを定義
export const SpecifyFaceRequestSchema = z.object({
  faceId: FaceIdSchema,
});
export type SpecifyFaceRequest = z.infer<typeof SpecifyFaceRequestSchema>;

// GET
export const FaceSortBySchema = z.enum(['lastpostedAt', 'seedsCount']);
export type FaceSortBy = z.infer<typeof FaceSortBySchema>;

export const QueryFaceRequestSchema = z.object({
  q: SearchQuerySchema.optional(),
  userId: UserIdSchema.optional(),
  sortBy: FaceSortBySchema.optional(),
  order: SortOrderTypeSchema.optional(),
  limit: ListRequestLimitSchema.optional(),
  cursor: FaceIdSchema.optional(),
});
export type QueryFaceRequest = z.infer<typeof QueryFaceRequestSchema>;
