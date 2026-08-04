import 'server-only';

import type {
  FriendshipPendingListType,
  FriendListPage,
  PendingListPage,
} from '@/types/friendship';
import { getFriendshipRepository } from '@/repositories/friendship-repository';
import { getSessionTokens } from '@/lib/session';
import type { ApiResult } from '@/lib/api-error';

async function withAccessToken<T>(
  run: (accessToken: string) => Promise<ApiResult<T>>
): Promise<ApiResult<T>> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return { success: false, errorKind: 'UNAUTHORIZED' };
  }
  return run(accessToken);
}

/** フレンド申請を送る */
export async function sendFriendRequest(addresseeId: string): Promise<ApiResult<void>> {
  return withAccessToken((accessToken) =>
    getFriendshipRepository().create(accessToken, addresseeId)
  );
}

/** 届いたフレンド申請を承認する */
export async function acceptFriendRequest(requestId: string): Promise<ApiResult<void>> {
  return withAccessToken((accessToken) => getFriendshipRepository().accept(accessToken, requestId));
}

/** フレンド申請を取り消す（自分が送った側）、または拒否する（相手から届いた側） */
export async function rejectFriendRequest(requestId: string): Promise<ApiResult<void>> {
  return withAccessToken((accessToken) => getFriendshipRepository().reject(accessToken, requestId));
}

/** フレンド関係を解消する */
export async function endFriendship(targetUserId: string): Promise<ApiResult<void>> {
  return withAccessToken((accessToken) => getFriendshipRepository().end(accessToken, targetUserId));
}

/** 承認済みのフレンド一覧を取得する（オンライン状態込み） */
export async function getMyFriends(cursor?: string | null): Promise<ApiResult<FriendListPage>> {
  return withAccessToken((accessToken) =>
    getFriendshipRepository().listFriends(accessToken, { cursor })
  );
}

/** 保留中のフレンド申請一覧（受信／送信）を取得する */
export async function getMyPendingRequests(
  type: FriendshipPendingListType,
  cursor?: string | null,
  limit?: number
): Promise<ApiResult<PendingListPage>> {
  return withAccessToken((accessToken) =>
    getFriendshipRepository().listPendingRequests(accessToken, { type, cursor, limit })
  );
}

/** 自分宛ての未処理フレンド申請が1件以上あるかどうかを確認する（通知バッジ用） */
export async function hasPendingIncomingFriendRequest(): Promise<ApiResult<boolean>> {
  const result = await getMyPendingRequests('incoming', undefined, 1);
  if (!result.success) {
    return result;
  }
  return { success: true, data: result.data.pendingRequests.length > 0 };
}
