import { z } from 'zod';
import { UserIdSchema } from './user';
import { UserProfileSchema } from './user-profile';
import { FriendshipIdSchema } from '../friendship/friendship';
import { createApiResponseSchema } from '../../shared/response';

export const RelationshipStatusSchema = z.enum([
  'SELF', // 自分自身
  'NONE', // 関係なし（未申請の他人）
  'PENDING_OUTGOING', // 自分から申請中
  'PENDING_INCOMING', // 相手から申請されている
  'FRIEND', // フレンド
  'BLOCKED', // ブロック中
  'BLOCKED_BY', // 相手からブロックされている
]);
export type RelationshipStatus = z.infer<typeof RelationshipStatusSchema>;

export const RelationshipSchema = z.object({
  status: RelationshipStatusSchema,
  friendshipId: FriendshipIdSchema.nullable(),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const UserProfileWithRelationshipSchema = UserProfileSchema.extend({
  relationship: RelationshipSchema,
});
export type UserProfileWithRelationship = z.infer<typeof UserProfileWithRelationshipSchema>;

export const UserProfileMapSchema = z.record(
  UserIdSchema,
  UserProfileWithRelationshipSchema.nullable()
);
export type UserProfileMap = z.infer<typeof UserProfileMapSchema>;

// GET /user-profile/profiles?ids=udid01,udid02,udid03,... のレスポンス
export const UserProfilesResponseSchema = createApiResponseSchema(
  z.object({
    profileMap: UserProfileMapSchema, // ユーザーIDをキーとしたマップ
  })
);
export type UserProfilesResponse = z.infer<typeof UserProfilesResponseSchema>;
