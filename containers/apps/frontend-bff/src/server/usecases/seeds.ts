import 'server-only';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import {
  type CreateSeedInput,
  type UpdateSeedInput,
  getSeedRepository,
} from '@/repositories/seed-repository';
import { findFaceById } from './faces';
import { getCurrentUser, findUserById, listAllUsers } from './users';

export type SeedLink = {
  seed: Seed;
  face: Face;
};

export type SeedDetailData = {
  seed: Seed;
  face: Face;
  author: UserProfile | null;
  isOwner: boolean;
  users: UserProfile[];
};

export async function listSeedsByUserId(userId: string): Promise<Seed[]> {
  return getSeedRepository().listByUserId(userId);
}

export async function listSeedsByFaceId(faceId: string): Promise<Seed[]> {
  return getSeedRepository().listByFaceId(faceId);
}

export async function listAllSeeds(): Promise<Seed[]> {
  return getSeedRepository().listAll();
}

export async function listSeedsByFaceIds(faceIds: string[]): Promise<Seed[]> {
  return getSeedRepository().listByFaceIds(faceIds);
}

export async function findSeedById(seedId: string): Promise<Seed | null> {
  return getSeedRepository().findById(seedId);
}

export async function createSeedForCurrentUser(input: CreateSeedInput): Promise<Seed> {
  const currentUser = await getCurrentUser();
  return getSeedRepository().create(currentUser.id, input);
}

export async function updateSeedForCurrentUser(
  seedId: string,
  input: UpdateSeedInput
): Promise<Seed> {
  const currentUser = await getCurrentUser();
  return getSeedRepository().update(seedId, currentUser.id, input);
}

export async function deleteSeedForCurrentUser(seedId: string): Promise<void> {
  const currentUser = await getCurrentUser();
  return getSeedRepository().delete(seedId, currentUser.id);
}

export async function getSeedDetailData(seedId: string): Promise<SeedDetailData | null> {
  const seed = await getSeedRepository().findById(seedId);
  if (!seed) return null;

  const face = await findFaceById(seed.faceId);
  if (!face) return null;

  const [currentUser, author, users] = await Promise.all([
    getCurrentUser(),
    findUserById(seed.userId),
    listAllUsers(),
  ]);

  const isOwner = seed.userId === currentUser.id;

  return { seed, face, author, isOwner, users };
}
