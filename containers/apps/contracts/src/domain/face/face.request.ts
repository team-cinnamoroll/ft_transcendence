import { z } from 'zod';
import { FaceNameSchema, FaceDescriptionSchema, FaceEmojiSchema } from './face';
import { FileSchema } from '../../shared/file-metadata';
import { VisibilityStatusSchema } from '../../shared/primitives';

export const CreateFaceRequestSchema = z
  .object({
    name: FaceNameSchema,
    emoji: FaceEmojiSchema.nullable(),
    description: FaceDescriptionSchema.nullable(),
    image: FileSchema.nullable(),
    visibility: VisibilityStatusSchema,
  })
  .strict();
export type CreateFaceRequest = z.infer<typeof CreateFaceRequestSchema>;

export const UpdateFaceRequestSchema = z
  .object({
    name: FaceNameSchema,
    emoji: FaceEmojiSchema.nullable(),
    description: FaceDescriptionSchema.nullable(),
    image: FileSchema.nullable(),
    visibility: VisibilityStatusSchema,
  })
  .strict();
export type UpdateFaceRequest = z.infer<typeof UpdateFaceRequestSchema>;
