import 'server-only';

import type { Notification } from '@/types/notification';
import { getNotificationRepository } from '@/repositories/notification-repository';

export async function listNotifications(): Promise<Notification[]> {
  return await getNotificationRepository().listAll();
}
