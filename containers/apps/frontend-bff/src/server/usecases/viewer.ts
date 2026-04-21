import 'server-only';

import type { Face } from '@/types/face';
import type { User } from '@/types/user';
import { getCurrentUser } from './users';
import { listFacesByUserId } from './faces';

export type ViewerContext = {
  currentUser: User;
  myFaces: Face[];
};

export async function getViewerContext(): Promise<ViewerContext> {
  const currentUser = await getCurrentUser();
  const myFaces = await listFacesByUserId(currentUser.id);
  return { currentUser, myFaces };
}
