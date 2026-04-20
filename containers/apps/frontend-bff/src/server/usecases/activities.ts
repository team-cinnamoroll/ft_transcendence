import 'server-only';

import type { Activity } from '@/types/activity';
import { getActivityRepository } from '@/repositories/activity-repository';

export async function listActivitiesByUserId(userId: string): Promise<Activity[]> {
  return await getActivityRepository().listByUserId(userId);
}

export async function listActivitiesByFaceId(faceId: string): Promise<Activity[]> {
  return await getActivityRepository().listByFaceId(faceId);
}

export async function listAllActivities(): Promise<Activity[]> {
  return await getActivityRepository().listAll();
}

export async function listActivitiesByFaceIds(faceIds: string[]): Promise<Activity[]> {
  return await getActivityRepository().listByFaceIds(faceIds);
}

export async function findActivityById(activityId: string): Promise<Activity | null> {
  return await getActivityRepository().findById(activityId);
}
