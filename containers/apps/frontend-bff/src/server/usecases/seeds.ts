import 'server-only';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { type CreateSeedInput, getSeedRepository } from '@/repositories/seed-repository';
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
  outgoingLinks: SeedLink[];
  incomingLinks: SeedLink[];
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

export async function getSeedDetailData(seedId: string): Promise<SeedDetailData | null> {
  const seed = await getSeedRepository().findById(seedId);
  if (!seed) return null;

  const face = await findFaceById(seed.faceId);
  if (!face) return null;

  const [currentUser, author, allSeeds, users] = await Promise.all([
    getCurrentUser(),
    findUserById(seed.userId),
    getSeedRepository().listAll(),
    listAllUsers(),
  ]);

  const isOwner = seed.userId === currentUser.id;

  const outgoingLinks: SeedLink[] = (
    await Promise.all(
      (seed.linkedSeedIds ?? []).map(async (id) => {
        const linked = await getSeedRepository().findById(id);
        if (!linked) return null;
        const linkedFace = await findFaceById(linked.faceId);
        return linkedFace ? { seed: linked, face: linkedFace } : null;
      })
    )
  ).filter((x): x is SeedLink => x !== null);

  const incomingLinks: SeedLink[] = (
    await Promise.all(
      allSeeds
        .filter((s) => s.id !== seed.id && (s.linkedSeedIds ?? []).includes(seed.id))
        .map(async (s) => {
          const linkedFace = await findFaceById(s.faceId);
          return linkedFace ? { seed: s, face: linkedFace } : null;
        })
    )
  ).filter((x): x is SeedLink => x !== null);

  return { seed, face, author, isOwner, outgoingLinks, incomingLinks, users };
}
