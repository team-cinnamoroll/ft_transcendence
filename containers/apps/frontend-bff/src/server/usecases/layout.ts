import 'server-only';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import type { FriendProfileWithOnlineStatus } from '@/types/friendship';
import { getCurrentUser } from './users';
import { listFacesByUserId } from './faces';
import { listSeedsByUserId } from './seeds';
import { getMyFriends } from './friendship';

export type LayoutData = {
  currentUser: UserProfile;
  myFaces: Face[];
  mySeeds: Seed[];
  /** ContextRail の「収集」セクションに表示するフレンド一覧。1ページ目のみを対象とする。 */
  friends: FriendProfileWithOnlineStatus[];
};

export async function getLayoutData(): Promise<LayoutData> {
  const currentUser = await getCurrentUser();

  const [myFaces, mySeeds, friendsResult] = await Promise.all([
    listFacesByUserId(currentUser.id),
    listSeedsByUserId(currentUser.id),
    getMyFriends(),
  ]);

  return {
    currentUser,
    myFaces,
    mySeeds,
    friends: friendsResult.success ? friendsResult.data.friendships : [],
  };
}
