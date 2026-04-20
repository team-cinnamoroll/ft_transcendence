import 'server-only';

import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { User } from '@/types/user';
import { findActivityById, listActivitiesByFaceId } from './activities';
import { findFaceById } from './faces';
import { getCurrentUser, findUserById, listAllUsers } from './users';

export type FaceDetailPanelData = {
  currentUser: User;
  face: Face | null;
  activities: Activity[];
  users: User[];
};

export async function getFaceDetailPanelData(faceId: string): Promise<FaceDetailPanelData> {
  const currentUser = await getCurrentUser();

  const [face, activities, users] = await Promise.all([
    findFaceById(faceId),
    listActivitiesByFaceId(faceId),
    listAllUsers(),
  ]);

  return { currentUser, face, activities, users };
}

export type ActivityDetailPanelData = {
  activity: Activity | null;
  user: User | null;
  face: Face | null;
};

export async function getActivityDetailPanelData(
  activityId: string
): Promise<ActivityDetailPanelData> {
  const activity = await findActivityById(activityId);
  if (!activity) {
    return { activity: null, user: null, face: null };
  }

  const [user, face] = await Promise.all([
    findUserById(activity.userId),
    findFaceById(activity.faceId),
  ]);

  return { activity, user, face };
}
