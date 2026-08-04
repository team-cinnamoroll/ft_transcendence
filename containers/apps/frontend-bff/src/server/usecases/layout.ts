import 'server-only';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getCurrentUser, findUsersByIds } from './users';
import { listFacesByUserId, findFaceById } from './faces';
import { listSeedsByUserId, listSeedsByFaceId } from './seeds';
import { getSubscribedFaceIds } from './subscriptions';

export type LayoutData = {
  currentUser: UserProfile;
  myFaces: Face[];
  mySeeds: Seed[];
  subscribedFaces: Face[];
  latestSeedByFaceId: Record<string, Seed>;
  allUsers: UserProfile[];
};

export async function getLayoutData(): Promise<LayoutData> {
  const currentUser = await getCurrentUser();

  const [myFaces, mySeeds, subscribedFaceIds] = await Promise.all([
    listFacesByUserId(currentUser.id),
    listSeedsByUserId(currentUser.id),
    getSubscribedFaceIds(),
  ]);

  const subscribedFaces: Face[] = (
    await Promise.all(subscribedFaceIds.map((id) => findFaceById(id)))
  ).filter((f): f is Face => f !== null);

  const [latestSeedEntries, allUsers] = await Promise.all([
    Promise.all(
      subscribedFaces.map(async (face) => {
        const faceSeeds = await listSeedsByFaceId(face.id);
        return faceSeeds.length > 0 ? ([face.id, faceSeeds[0]] as const) : null;
      })
    ),
    findUsersByIds(subscribedFaces.map((face) => face.userId)),
  ]);
  const latestSeedByFaceId: Record<string, Seed> = Object.fromEntries(
    latestSeedEntries.filter((e): e is [string, Seed] => e !== null)
  );

  return {
    currentUser,
    myFaces,
    mySeeds,
    subscribedFaces,
    latestSeedByFaceId,
    allUsers,
  };
}
