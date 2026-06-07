import 'server-only';

import type { Seed } from '@/types/seed';
import { getActivityRepository } from '@/repositories/activity-repository';

export async function listActivitiesByUserId(userId: string): Promise<Seed[]> {
  return await getActivityRepository().listByUserId(userId);
}

export async function listActivitiesByFaceId(faceId: string): Promise<Seed[]> {
  return await getActivityRepository().listByFaceId(faceId);
}

export async function listAllActivities(): Promise<Seed[]> {
  return await getActivityRepository().listAll();
}

export async function listActivitiesByFaceIds(faceIds: string[]): Promise<Seed[]> {
  return await getActivityRepository().listByFaceIds(faceIds);
}

export async function findActivityById(activityId: string): Promise<Seed | null> {
  return await getActivityRepository().findById(activityId);
}
