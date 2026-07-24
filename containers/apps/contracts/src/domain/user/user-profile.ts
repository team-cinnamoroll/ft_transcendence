import { z } from 'zod';

import { UserIdSchema } from './user';
import { FileSchema } from '../../shared/file-metadata';
import { createApiResponseSchema } from '../../shared/response';

export const UserNicknameSchema = z.string().min(1).max(100);
export type UserNickname = z.infer<typeof UserNicknameSchema>;

// 見た目上の文字数（書記素クラスター）を分割するためのセグメンター
const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
export const AvatarBadgeSchema = z
  .emoji() // 絵文字判定（メッセージは errorMap で i18n）
  .refine((val) => {
    // 見た目上の文字数が1文字であるかを判定
    return [...segmenter.segment(val)].length === 1;
  }); // バッジ絵文字

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

export const UserProfileMapSchema = z.record(UserIdSchema, UserProfileSchema.nullable());
export type UserProfileMap = z.infer<typeof UserProfileMapSchema>;

// GET /user-profile/profiles?ids=... のレスポンス
export const UserProfilesResponseSchema = createApiResponseSchema(
  z.object({
    profiles: UserProfileMapSchema, // ユーザーIDをキーとしたマップ
  })
);
export type UserProfilesResponse = z.infer<typeof UserProfilesResponseSchema>;
