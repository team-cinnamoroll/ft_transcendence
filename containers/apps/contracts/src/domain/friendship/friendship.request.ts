import { z } from 'zod';
import { UserIdSchema } from '../user';
import { FriendshipIdSchema } from './friendship';
import { ListRequestLimitSchema } from '../../shared/primitives';

const FriendshipUpdateStatusRequestSchema = z.object({
  requestId: FriendshipIdSchema,
});

export const FriendshipIdCursorSchema = FriendshipIdSchema.nullable().default(null); // ページング用のカーソル、nullの場合は最初のページ
export type FriendshipIdCursor = z.infer<typeof FriendshipIdCursorSchema>;

export const FriendshipPendingListTypeSchema = z.enum(['incoming', 'outgoing']);
export type FriendshipPendingListType = z.infer<typeof FriendshipPendingListTypeSchema>;

// フレンド申請の送信リクエスト
export const FriendshipCreateRequestSchema = z.object({
  addresseeId: UserIdSchema,
});
export type FriendshipCreateRequest = z.infer<typeof FriendshipCreateRequestSchema>;

// フレンド申請の承認リクエスト
export const FriendshipAcceptRequestSchema = FriendshipUpdateStatusRequestSchema;
export type FriendshipAcceptRequest = z.infer<typeof FriendshipAcceptRequestSchema>;

// フレンド申請の取り消し・拒否リクエスト
export const FriendshipRejectRequestSchema = FriendshipUpdateStatusRequestSchema;
export type FriendshipRejectRequest = z.infer<typeof FriendshipRejectRequestSchema>;

// フレンド一覧の取得リクエスト
export const FriendshipListRequestSchema = z.object({
  limit: ListRequestLimitSchema,
  cursor: FriendshipIdCursorSchema.optional(),
});
export type FriendshipListRequest = z.infer<typeof FriendshipListRequestSchema>;

// フレンド申請一覧の取得（受信／送信）リクエスト
export const FriendshipPendingListRequestSchema = z.object({
  type: FriendshipPendingListTypeSchema, // 受信／送信のどちらの申請一覧を取得するか
  limit: ListRequestLimitSchema,
  cursor: FriendshipIdCursorSchema,
});
export type FriendshipPendingListRequest = z.infer<typeof FriendshipPendingListRequestSchema>;

// フレンド関係の解除リクエスト（レスポンスは204 No Content）
export const FriendshipEndRequestSchema = z.object({
  targetUserId: UserIdSchema,
});
export type FriendshipEndRequest = z.infer<typeof FriendshipEndRequestSchema>;
