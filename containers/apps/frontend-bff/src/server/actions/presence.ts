'use server';

import { sendHeartbeat, getOnlineStatuses } from '@/server/usecases/presence';

/** クライアントから定期的に呼ばれる、オンライン通知用のServer Action */
export async function heartbeatAction(): Promise<void> {
  await sendHeartbeat();
}

/**
 * 表示中フレンドのオンライン状態をまとめて再取得するServer Action。
 * 失敗時は呼び出し元がこれまでの表示を維持できるよう null を返す。
 */
export async function refreshOnlineStatusesAction(
  userIds: string[]
): Promise<Record<string, boolean> | null> {
  const result = await getOnlineStatuses(userIds);
  return result.success ? result.data.onlineStatuses : null;
}
