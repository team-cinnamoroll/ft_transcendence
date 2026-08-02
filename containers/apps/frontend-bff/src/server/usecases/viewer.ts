import 'server-only';

import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getCurrentUser, findUserById } from './users';
import { listFacesByUserId } from './faces';

export type ViewerContext = {
  currentUser: UserProfile;
  /** Seedの投稿者表示・プロフィールへのリンク用。id が本物のログインIDになっている */
  linkableCurrentUser: UserProfile;
  myFaces: Face[];
};

export async function getViewerContext(): Promise<ViewerContext> {
  const currentUser = await getCurrentUser();
  const [myFaces, linkableCurrentUser] = await Promise.all([
    listFacesByUserId(currentUser.id),
    findUserById(currentUser.id),
  ]);
  return { currentUser, linkableCurrentUser: linkableCurrentUser ?? currentUser, myFaces };
}
