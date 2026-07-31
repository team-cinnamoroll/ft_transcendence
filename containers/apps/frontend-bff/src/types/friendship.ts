import type { FriendshipListResponse, FriendshipPendingListResponse } from '@tracen/contracts';

export type {
  FriendshipPendingListType,
  FriendshipListResponse,
  FriendshipPendingListResponse,
  FriendProfileWithOnlineStatus,
  UnconfirmedFriendProfile,
} from '@tracen/contracts';

type SuccessData<T extends { success: true }> = T extends { data: infer D } ? D : never;

/** フレンド一覧APIのレスポンスから、成功時の data 部分だけを取り出した型 */
export type FriendListPage = SuccessData<Extract<FriendshipListResponse, { success: true }>>;

/** フレンド申請一覧APIのレスポンスから、成功時の data 部分だけを取り出した型 */
export type PendingListPage = SuccessData<
  Extract<FriendshipPendingListResponse, { success: true }>
>;
