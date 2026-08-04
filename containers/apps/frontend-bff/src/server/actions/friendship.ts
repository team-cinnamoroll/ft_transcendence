'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type {
  FriendshipPendingListType,
  FriendListPage,
  PendingListPage,
} from '@/types/friendship';
import type { ApiErrorKind, ApiResult } from '@/lib/api-error';
import type { SimpleApi } from '@/types/api';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  endFriendship,
  getMyFriends,
  getMyPendingRequests,
  hasPendingIncomingFriendRequest,
} from '@/server/usecases/friendship';
import type { ActionResult } from './result';

/**
 * フレンド操作失敗時の errorKind を、i18n対応した表示文言に変換する。
 *
 * 実際に返しうる errorKind:
 * - UNAUTHORIZED(401): JWTが無効・欠落している（セッション切れ）
 * - FORBIDDEN(403)/NOT_FOUND(404)/CONFLICT(409): 状態が既に変わっている等
 *
 * ユーザーが次に取るべき行動が変わるのは UNAUTHORIZED（再ログインが必要）のみ。
 * それ以外は「もう一度試す」以外に取れる行動が無いため、共通の errorGeneric にまとめる。
 */
async function resolveFriendshipErrorMessage(errorKind: ApiErrorKind): Promise<string> {
  const t = await getTranslations('profilePage');
  if (errorKind === 'UNAUTHORIZED') {
    return t('errorSessionExpired');
  }
  return t('errorGeneric');
}

function revalidateProfilePaths(targetUserId: string) {
  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath('/friends');
}

export async function sendFriendRequestAction(
  addresseeId: string
): Promise<ActionResult<SimpleApi>> {
  const result = await sendFriendRequest(addresseeId);
  if (!result.success) {
    return {
      success: true,
      data: { success: false, message: await resolveFriendshipErrorMessage(result.errorKind) },
    };
  }
  revalidateProfilePaths(addresseeId);
  return { success: true, data: { success: true } };
}

export async function acceptFriendRequestAction(
  requestId: string,
  targetUserId: string
): Promise<ActionResult<SimpleApi>> {
  const result = await acceptFriendRequest(requestId);
  if (!result.success) {
    return {
      success: true,
      data: { success: false, message: await resolveFriendshipErrorMessage(result.errorKind) },
    };
  }
  revalidateProfilePaths(targetUserId);
  return { success: true, data: { success: true } };
}

export async function rejectFriendRequestAction(
  requestId: string,
  targetUserId: string
): Promise<ActionResult<SimpleApi>> {
  const result = await rejectFriendRequest(requestId);
  if (!result.success) {
    return {
      success: true,
      data: { success: false, message: await resolveFriendshipErrorMessage(result.errorKind) },
    };
  }
  revalidateProfilePaths(targetUserId);
  return { success: true, data: { success: true } };
}

export async function removeFriendAction(targetUserId: string): Promise<ActionResult<SimpleApi>> {
  const result = await endFriendship(targetUserId);
  if (!result.success) {
    return {
      success: true,
      data: { success: false, message: await resolveFriendshipErrorMessage(result.errorKind) },
    };
  }
  revalidateProfilePaths(targetUserId);
  return { success: true, data: { success: true } };
}

/** フレンド一覧の続きを取得する（「もっと見る」用） */
export async function loadMoreFriendsAction(
  cursor: string | null
): Promise<ApiResult<FriendListPage>> {
  return getMyFriends(cursor);
}

/** 保留中の申請一覧の続きを取得する（「もっと見る」用） */
export async function loadMorePendingRequestsAction(
  type: FriendshipPendingListType,
  cursor: string | null
): Promise<ApiResult<PendingListPage>> {
  return getMyPendingRequests(type, cursor);
}

/**
 * 自分宛ての未処理フレンド申請が1件以上あるかどうかを確認する（通知バッジ用）。
 * ハートビートと同じく結果を画面に反映するだけの確認なので、失敗時は「無し」として扱う。
 */
export async function checkPendingFriendRequestsAction(): Promise<boolean> {
  const result = await hasPendingIncomingFriendRequest();
  return result.success ? result.data : false;
}
