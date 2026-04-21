import 'server-only';

import { getSubscriptionRepository } from '@/repositories/subscription-repository';

export async function getSubscribedFaceIds(): Promise<string[]> {
  return await getSubscriptionRepository().getSubscribedFaceIds();
}
