import 'server-only';

import type { ApiResult } from '@/lib/api-error';
import type { PresenceStatusData } from '@/types/presence';
import { getPresenceRepository } from '@/repositories/presence-repository';
import { getSessionTokens } from '@/lib/session';

/** ログイン中の場合のみ、オンラインであることをサーバーに伝える */
export async function sendHeartbeat(): Promise<void> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return;
  }
  await getPresenceRepository().sendHeartbeat(accessToken);
}

/** 指定したユーザーIDそれぞれの最新のオンライン状態をまとめて取得する */
export async function getOnlineStatuses(userIds: string[]): Promise<ApiResult<PresenceStatusData>> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return { success: false, errorKind: 'UNAUTHORIZED' };
  }
  return await getPresenceRepository().getOnlineStatuses(accessToken, userIds);
}
