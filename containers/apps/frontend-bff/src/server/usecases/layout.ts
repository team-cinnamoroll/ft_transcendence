import 'server-only';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getCurrentUser, listAllUsers } from './users';
import { listFacesByUserId, findFaceById } from './faces';
import { listSeedsByUserId, listSeedsByFaceId } from './seeds';
import { getSubscribedFaceIds } from './subscriptions';
import { getAuthSession } from './auth';

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
  const session = await getAuthSession();

  const [myFaces, mySeeds, subscribedFaceIds, allUsers] = await Promise.all([
    // Faceは本物のバックエンドAPIに接続済みのため、モックID(currentUser.id)ではなく
    // 本物のログインID(session.userId)で取得する必要がある(#314で発覚した不整合への暫定対応、#318で解消予定)
    listFacesByUserId(session?.userId ?? currentUser.id),
    // SeedはまだモックデータのままなのでcurrentUser.id(モックID)を使い続ける
    listSeedsByUserId(currentUser.id),
    getSubscribedFaceIds(),
    listAllUsers(),
  ]);

  const subscribedFaces: Face[] = (
    await Promise.all(subscribedFaceIds.map((id) => findFaceById(id)))
  ).filter((f): f is Face => f !== null);

  const latestSeedEntries = await Promise.all(
    subscribedFaces.map(async (face) => {
      const faceSeeds = await listSeedsByFaceId(face.id);
      return faceSeeds.length > 0 ? ([face.id, faceSeeds[0]] as const) : null;
    })
  );
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
