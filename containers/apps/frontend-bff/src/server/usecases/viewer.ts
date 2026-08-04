import 'server-only';

import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getCurrentUser, findUserById } from './users';
import { listFacesByUserId } from './faces';
import { getAuthSession } from './auth';

export type ViewerContext = {
  currentUser: UserProfile;
  /** Seedの投稿者表示・プロフィールへのリンク用。id が本物のログインIDになっている */
  linkableCurrentUser: UserProfile;
  myFaces: Face[];
};

export async function getViewerContext(): Promise<ViewerContext> {
  const currentUser = await getCurrentUser();
  const session = await getAuthSession();
  // Faceは本物のバックエンドAPIに接続済みのため、モックID(currentUser.id)ではなく
  // 本物のログインID(session.userId)で取得する必要がある(#314で発覚した不整合への暫定対応、#318で解消予定)
  const [myFaces, linkableCurrentUser] = await Promise.all([
    listFacesByUserId(session?.userId ?? currentUser.id),
    findUserById(currentUser.id),
  ]);
  return { currentUser, linkableCurrentUser: linkableCurrentUser ?? currentUser, myFaces };
}
