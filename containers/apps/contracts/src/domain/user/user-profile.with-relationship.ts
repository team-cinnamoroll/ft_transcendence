import { z } from 'zod';
import { UserProfileSchema } from './user-profile';
import { FriendshipIdSchema } from '../friendship/friendship';

export const RelationshipStatusSchema = z.enum([
  'SELF', // 自分自身
  'NONE', // 関係なし（未申請の他人）
  'PENDING_OUTGOING', // 自分から申請中
  'PENDING_INCOMING', // 相手から申請されている
  'FRIEND', // フレンド
  'BLOCKED', // ブロック中
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
