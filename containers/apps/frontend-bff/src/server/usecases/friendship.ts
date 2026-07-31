import 'server-only';

import { getFriendshipRepository } from '@/repositories/friendship-repository';
import { getSessionTokens } from '@/lib/session';
import type { ApiResult } from '@/lib/api-error';

async function withAccessToken(
  run: (accessToken: string) => Promise<ApiResult<void>>
): Promise<ApiResult<void>> {
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
