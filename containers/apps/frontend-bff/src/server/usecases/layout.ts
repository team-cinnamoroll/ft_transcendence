import 'server-only';

import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getCurrentUser, listAllUsers } from './users';
import { listFacesByUserId, findFaceById } from './faces';
import { listActivitiesByUserId, listActivitiesByFaceId } from './activities';
import { getSubscribedFaceIds } from './subscriptions';

export type LayoutData = {
  currentUser: UserProfile;
  myFaces: Face[];
  myActivities: Activity[];
  subscribedFaces: Face[];
  latestActivityByFaceId: Record<string, Activity>;
  allUsers: UserProfile[];
};

export async function getLayoutData(): Promise<LayoutData> {
  const currentUser = await getCurrentUser();

  const [myFaces, myActivities, subscribedFaceIds, allUsers] = await Promise.all([
    listFacesByUserId(currentUser.id),
    listActivitiesByUserId(currentUser.id),
    getSubscribedFaceIds(),
    listAllUsers(),
  ]);

  const subscribedFaces: Face[] = (
    await Promise.all(subscribedFaceIds.map((id) => findFaceById(id)))
  ).filter((f): f is Face => f !== null);

  // 各サブスクフェイスの最新アクティビティを取得（Record で保持 — Map は JSON 非シリアライズのため）
  const latestActivityEntries = await Promise.all(
    subscribedFaces.map(async (face) => {
      const faceActivities = await listActivitiesByFaceId(face.id);
      return faceActivities.length > 0 ? ([face.id, faceActivities[0]] as const) : null;
    })
  );
  const latestActivityByFaceId: Record<string, Activity> = Object.fromEntries(
    latestActivityEntries.filter((e): e is [string, Activity] => e !== null)
  );

  return {
    currentUser,
    myFaces,
    myActivities,
    subscribedFaces,
    latestActivityByFaceId,
    allUsers,
  };
}
