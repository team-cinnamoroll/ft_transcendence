import { z } from 'zod';

import { UserIdSchema } from '../user';
import { FileSchema } from '../../shared/file-metadata';
import { EmojiSchema, VisibilityStatusSchema, UuidSchema } from '../../shared/primitives';
import { createApiResponseSchema } from '../../shared/response';

export const FaceIdSchema = UuidSchema;
export type FaceId = z.infer<typeof FaceIdSchema>;

export const FaceNameSchema = z.string().min(1);
export type FaceName = z.infer<typeof FaceNameSchema>;

export const FaceDescriptionSchema = z.string();
export type FaceDescription = z.infer<typeof FaceDescriptionSchema>;

export const FaceEmojiSchema = EmojiSchema;
export type FaceEmoji = z.infer<typeof FaceEmojiSchema>;

export const FaceSchema = z
  .object({
    id: FaceIdSchema,
    userId: UserIdSchema,
    name: FaceNameSchema,
    emoji: FaceEmojiSchema.nullable(),
    description: FaceDescriptionSchema.nullable(),
    image: FileSchema.nullable(),
    visibility: VisibilityStatusSchema,
  })
  .strict();
export type Face = z.infer<typeof FaceSchema>;

// API レスポンス用のスキーマ
export const FaceResponseSchema = createApiResponseSchema(FaceSchema);
export type FaceResponse = z.infer<typeof FaceResponseSchema>;
