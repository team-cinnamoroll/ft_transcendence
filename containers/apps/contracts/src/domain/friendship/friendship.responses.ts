import { z } from 'zod';
import { createApiResponseSchema } from '../../shared/response';
import { FriendshipSchema, FriendshipIdSchema } from './friendship';
import { UserProfileSchema } from '../user';
import { IsoDateTimeStringSchema, IsOnlineSchema } from '../../shared/primitives';

const FriendshipResponseSchema = createApiResponseSchema(
  z.object({
    friendship: FriendshipSchema,
  })
);

export const FriendProfileSchema = z.object({
  friendshipId: FriendshipIdSchema,
  friendProfile: UserProfileSchema,
  becameFriendsAt: IsoDateTimeStringSchema, // フレンドになった日時 （フレンドなので必ず存在する）
});
export type FriendProfile = z.infer<typeof FriendProfileSchema>;

export const FriendProfileWithOnlineStatusSchema = FriendProfileSchema.extend({
  isOnline: IsOnlineSchema,
});
export type FriendProfileWithOnlineStatus = z.infer<typeof FriendProfileWithOnlineStatusSchema>;

export const UnconfirmedFriendProfileSchema = z.object({
  requestId: FriendshipIdSchema,
  userProfile: UserProfileSchema,
  requestedAt: IsoDateTimeStringSchema, // フレンド申請した日時orフレンド申請された日時
});
export type UnconfirmedFriendProfile = z.infer<typeof UnconfirmedFriendProfileSchema>;

// フレンド申請の送信レスポンス
export const FriendshipCreateResponseSchema = createApiResponseSchema(
  z.object({
    friendship: FriendshipSchema,
  })
);
export type FriendshipCreateResponse = z.infer<typeof FriendshipCreateResponseSchema>;

// フレンド申請の承認レスポンス
export const FriendshipAcceptResponseSchema = FriendshipResponseSchema;
export type FriendshipAcceptResponse = z.infer<typeof FriendshipAcceptResponseSchema>;

// フレンド申請の取り消し・拒否レスポンス
export const FriendshipRejectResponseSchema = createApiResponseSchema(
  z.object({
    friendship: FriendshipSchema.nullable(), // 取り消しの場合はフレンド関係を削除するため null になる
  })
);

export type FriendshipRejectResponse = z.infer<typeof FriendshipRejectResponseSchema>;

// フレンド一覧の取得レスポンス
export const FriendshipListResponseSchema = createApiResponseSchema(
  z.object({
    friendships: z.array(FriendProfileWithOnlineStatusSchema),
    nextCursor: z.string().nullable(),
  })
);
export type FriendshipListResponse = z.infer<typeof FriendshipListResponseSchema>;

// フレンド申請一覧の取得（受信／送信）レスポンス
export const FriendshipPendingListResponseSchema = createApiResponseSchema(
  z.object({
    pendingRequests: z.array(UnconfirmedFriendProfileSchema),
    nextCursor: z.string().nullable(),
  })
);
export type FriendshipPendingListResponse = z.infer<typeof FriendshipPendingListResponseSchema>;
