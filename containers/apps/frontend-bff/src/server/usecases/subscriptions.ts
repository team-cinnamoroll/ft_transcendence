import 'server-only';

import { getSubscriptionRepository } from '@/repositories/subscription-repository';

export async function getSubscribedFaceIds(): Promise<string[]> {
  return await getSubscriptionRepository().getSubscribedFaceIds();
}

export async function subscribeFace(faceId: string): Promise<void> {
  return await getSubscriptionRepository().subscribe(faceId);
}

export async function unsubscribeFace(faceId: string): Promise<void> {
  return await getSubscriptionRepository().unsubscribe(faceId);
}
