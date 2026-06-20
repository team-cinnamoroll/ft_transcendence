'use server';

import { revalidatePath } from 'next/cache';
import { subscribeFace, unsubscribeFace } from '@/server/usecases/subscriptions';
import type { ActionResult } from './result';

export async function subscribeAction(faceId: string): Promise<ActionResult<void>> {
  await subscribeFace(faceId);
  revalidatePath('/');
  return { success: true, data: undefined };
}

export async function unsubscribeAction(faceId: string): Promise<ActionResult<void>> {
  await unsubscribeFace(faceId);
  revalidatePath('/');
  return { success: true, data: undefined };
}
