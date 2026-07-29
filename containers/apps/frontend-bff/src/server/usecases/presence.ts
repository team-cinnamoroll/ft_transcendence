import 'server-only';

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
