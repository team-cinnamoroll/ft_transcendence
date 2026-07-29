'use server';

import { sendHeartbeat } from '@/server/usecases/presence';

/** クライアントから定期的に呼ばれる、オンライン通知用のServer Action */
export async function heartbeatAction(): Promise<void> {
  await sendHeartbeat();
}
