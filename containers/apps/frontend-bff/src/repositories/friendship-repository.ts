import 'server-only';

import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';
import { classifyHttpStatus, type ApiResult } from '@/lib/api-error';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** FriendshipRepository が提供するメソッドの契約（Spec） */
export type FriendshipRepositorySpec = {
  /** フレンド申請を送る */
  create: (accessToken: string, addresseeId: string) => Promise<ApiResult<void>>;
  /** 届いたフレンド申請を承認する */
  accept: (accessToken: string, requestId: string) => Promise<ApiResult<void>>;
  /** フレンド申請を取り消す（自分が送った側）、または拒否する（相手から届いた側） */
  reject: (accessToken: string, requestId: string) => Promise<ApiResult<void>>;
  /** フレンド関係を解消する */
  end: (accessToken: string, targetUserId: string) => Promise<ApiResult<void>>;
};

// ─── バックエンドAPI実装 ────────────────────────────────────────

export function createFriendshipApiRepositoryImpl(): FriendshipRepositorySpec {
  return {
    create: async (accessToken, addresseeId) => {
      const res = await createBackendClient(accessToken).api.v1.friendships.requests.$post({
        json: { addresseeId },
      });
      if (!res.ok) {
        console.error('FriendshipRepository.create: backend request failed', res.status);
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      return { success: true, data: undefined };
    },

    accept: async (accessToken, requestId) => {
      const res = await createBackendClient(accessToken).api.v1.friendships.requests[
        ':requestId'
      ].accept.$patch({
        param: { requestId },
      });
      if (!res.ok) {
        console.error('FriendshipRepository.accept: backend request failed', res.status);
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      return { success: true, data: undefined };
    },

    reject: async (accessToken, requestId) => {
      const res = await createBackendClient(accessToken).api.v1.friendships.requests[
        ':requestId'
      ].$delete({
        param: { requestId },
      });
      if (!res.ok) {
        console.error('FriendshipRepository.reject: backend request failed', res.status);
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      return { success: true, data: undefined };
    },

    end: async (accessToken, targetUserId) => {
      const res = await createBackendClient(accessToken).api.v1.friendships[
        ':targetUserId'
      ].$delete({
        param: { targetUserId },
      });
      if (!res.ok) {
        console.error('FriendshipRepository.end: backend request failed', res.status);
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      return { success: true, data: undefined };
    },
  };
}

export const friendshipApiRepositoryImpl: FriendshipRepositorySpec =
  createFriendshipApiRepositoryImpl();

/** Provider: DI の入口（実装の選択はここに閉じ込める） */
export const getFriendshipRepository = createSingletonProvider<FriendshipRepositorySpec>(
  () => friendshipApiRepositoryImpl
);
