import 'server-only';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getCurrentUser, findUsersByIds } from './users';
import { listFacesByUserId } from './faces';
import { listSeedsByUserId } from './seeds';

export type LayoutData = {
  currentUser: UserProfile;
  myFaces: Face[];
  mySeeds: Seed[];
  /**
   * サブスクリプション機能の廃止に伴い常に空配列。
   * ContextRail の「収集」セクションをフレンドベースの表示に置き換える対応(#342)で見直す。
   */
  subscribedFaces: Face[];
  /** 同上、サブスクリプション機能の廃止に伴い常に空オブジェクト(#342で見直す) */
  latestSeedByFaceId: Record<string, Seed>;
  allUsers: UserProfile[];
};

export async function getLayoutData(): Promise<LayoutData> {
  const currentUser = await getCurrentUser();

  const [myFaces, mySeeds] = await Promise.all([
    listFacesByUserId(currentUser.id),
    listSeedsByUserId(currentUser.id),
  ]);

  const allUsers = await findUsersByIds([currentUser.id]);

  return {
    currentUser,
    myFaces,
    mySeeds,
    subscribedFaces: [],
    latestSeedByFaceId: {},
    allUsers,
  };
}
