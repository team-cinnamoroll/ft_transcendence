import 'server-only';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { findSeedById, listSeedsByFaceId } from './seeds';
import { findFaceById } from './faces';
import { getCurrentUser, findUserById, listAllUsers } from './users';

export type FaceDetailPanelData = {
  currentUser: UserProfile;
  face: Face | null;
  seeds: Seed[];
  users: UserProfile[];
};

export async function getFaceDetailPanelData(faceId: string): Promise<FaceDetailPanelData> {
  const currentUser = await getCurrentUser();

  const [face, seeds, users] = await Promise.all([
    findFaceById(faceId),
    listSeedsByFaceId(faceId),
    listAllUsers(),
  ]);

  return { currentUser, face, seeds, users };
}

export type SeedDetailPanelData = {
  seed: Seed | null;
  user: UserProfile | null;
  face: Face | null;
};

export async function getSeedDetailPanelData(seedId: string): Promise<SeedDetailPanelData> {
  const seed = await findSeedById(seedId);
  if (!seed) {
    return { seed: null, user: null, face: null };
  }

  const [user, face] = await Promise.all([
    findUserById(seed.userId),
    findFaceById(seed.faceId),
  ]);

  return { seed, user, face };
}
