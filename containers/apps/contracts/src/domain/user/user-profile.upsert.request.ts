import { z } from 'zod';
import { FileMetadataIdSchema } from '../../shared/file-metadata';
import { UserNicknameSchema, AvatarBadgeSchema } from './user-profile';

// 該当ユーザーのIDはJWTのサブジェクトクレームから取得するため、リクエストボディには含めない
export const UserProfileUpsertRequestSchema = z
  .object({
    name: UserNicknameSchema,
    avatarFileId: FileMetadataIdSchema.nullable(),
    badge: AvatarBadgeSchema.nullable(),
  })
  .strict();

export type UserProfileUpsertRequest = z.infer<typeof UserProfileUpsertRequestSchema>;
