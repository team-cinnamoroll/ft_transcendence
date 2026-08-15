/**
 * @/server/actions/friendship のモック。
 * Storybook 環境では 'use server' / next/cache が使えないため、
 * 本物の server/actions/friendship.ts と同じ関数名・戻り値の形(ActionResult/ApiResult)を持つ偽実装で置き換える。
 */
import type { SimpleApi } from '../../src/types/api';
import type { FriendListPage, PendingListPage } from '../../src/types/friendship';
import type { ApiResult } from '../../src/lib/api-error';
import type { ActionResult } from '../../src/server/actions/result';

export async function sendFriendRequestAction(): Promise<ActionResult<SimpleApi>> {
  return { success: true, data: { success: true } };
}

export async function acceptFriendRequestAction(): Promise<ActionResult<SimpleApi>> {
  return { success: true, data: { success: true } };
}

export async function rejectFriendRequestAction(): Promise<ActionResult<SimpleApi>> {
  return { success: true, data: { success: true } };
}

export async function removeFriendAction(): Promise<ActionResult<SimpleApi>> {
  return { success: true, data: { success: true } };
}

export async function loadMoreFriendsAction(): Promise<ApiResult<FriendListPage>> {
  return { success: true, data: { friendships: [], nextCursor: null } };
}

export async function loadMorePendingRequestsAction(): Promise<ApiResult<PendingListPage>> {
  return { success: true, data: { pendingRequests: [], nextCursor: null } };
}

/** 自分宛ての未処理フレンド申請の有無を確認するモック。Storybookでは常に「無し」を返す */
export async function checkPendingFriendRequestsAction(): Promise<boolean> {
  return false;
}
