import { z } from 'zod';

import { UserIdSchema } from './user';
import { FileSchema } from '../../shared/file-metadata';
import { EmojiSchema } from '../../shared/primitives';

export const UserNicknameSchema = z.string().min(1).max(100);
export type UserNickname = z.infer<typeof UserNicknameSchema>;

export const AvatarBadgeSchema = EmojiSchema;
export type AvatarBadge = z.infer<typeof AvatarBadgeSchema>;

// ユーザーデータのレスポンススキーマと型
export const UserProfileSchema = z
  .object({
    id: UserIdSchema,
    name: UserNicknameSchema,
    avatar: FileSchema.nullable(),
    badge: AvatarBadgeSchema.nullable(),
  })
  .strict();
export type UserProfile = z.infer<typeof UserProfileSchema>;
