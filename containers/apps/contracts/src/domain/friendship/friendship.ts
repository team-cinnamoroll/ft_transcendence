import { z } from 'zod';
import { UserIdSchema } from '../user/user';
import { IsoDateTimeStringSchema } from '../../shared/primitives';

// フレンド状態のステータス定義
export const FriendshipStatusSchema = z.enum([
  'PENDING', // 申請中
  'ACCEPTED', // 承認済み（互いにフレンド）
  'BLOCKED', // ブロック（必要に応じて）
]);

export type FriendshipStatus = z.infer<typeof FriendshipStatusSchema>;

export const FriendshipIdSchema = z.uuid();
export type FriendshipId = z.infer<typeof FriendshipIdSchema>;

// フレンド関係スキーマ
export const FriendshipSchema = z.object({
  id: FriendshipIdSchema, // リレーション自身のID
  requesterId: UserIdSchema, // 申請したユーザー
  addresseeId: UserIdSchema, // 申請されたユーザー
  status: FriendshipStatusSchema,
  createdAt: IsoDateTimeStringSchema,
  updatedAt: IsoDateTimeStringSchema,
});

export type Friendship = z.infer<typeof FriendshipSchema>;
