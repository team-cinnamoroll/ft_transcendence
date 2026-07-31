import 'server-only';

import type { PresenceStatusData, PresenceStatusResponse } from '@/types/presence';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';
import { classifyHttpStatus, type ApiResult } from '@/lib/api-error';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** PresenceRepository が提供するメソッドの契約（Spec） */
export type PresenceRepositorySpec = {
  /**
   * オンラインであることを通知する。
   * 結果は呼び出し元に伝えない（失敗してもUIに影響を与えず、次回のハートビートに委ねる仕様のため）。
   */
  sendHeartbeat: (accessToken: string) => Promise<void>;
  /**
   * オフラインであることを通知する。
   * 結果は呼び出し元に伝えない（失敗してもTTL失効によって最終的にオフライン扱いになるため）。
   */
  setOffline: (accessToken: string) => Promise<void>;
  /** 指定したユーザーIDそれぞれのオンライン状態をまとめて取得する */
  getOnlineStatuses: (
    accessToken: string,
    userIds: string[]
  ) => Promise<ApiResult<PresenceStatusData>>;
};

// ─── バックエンドAPI実装 ────────────────────────────────────────

export function createPresenceApiRepositoryImpl(): PresenceRepositorySpec {
  return {
    sendHeartbeat: async (accessToken) => {
      try {
        const res = await createBackendClient(accessToken).api.v1.presence.heartbeat.$post({
          json: {},
        });
        if (!res.ok) {
          console.error('PresenceRepository.sendHeartbeat: backend request failed', res.status);
        }
      } catch (err) {
        console.error('PresenceRepository.sendHeartbeat: request threw', err);
      }
    },

    setOffline: async (accessToken) => {
      try {
        const res = await createBackendClient(accessToken).api.v1.presence.offline.$post({
          json: {},
        });
        if (!res.ok) {
          console.error('PresenceRepository.setOffline: backend request failed', res.status);
        }
      } catch (err) {
        console.error('PresenceRepository.setOffline: request threw', err);
      }
    },

    getOnlineStatuses: async (accessToken, userIds) => {
      const res = await createBackendClient(accessToken).api.v1.presence.status.$post({
        json: { userIds },
      });
      if (!res.ok) {
        console.error('PresenceRepository.getOnlineStatuses: backend request failed', res.status);
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      const json = (await res.json()) as PresenceStatusResponse;
      if (!json.success) {
        return { success: false, errorKind: 'UNKNOWN' };
      }
      return { success: true, data: json.data };
    },
  };
}

export const presenceApiRepositoryImpl: PresenceRepositorySpec = createPresenceApiRepositoryImpl();

/** Provider: DI の入口（実装の選択はここに閉じ込める） */
export const getPresenceRepository = createSingletonProvider<PresenceRepositorySpec>(
  () => presenceApiRepositoryImpl
);
