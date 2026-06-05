import 'server-only';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getSeedRepository } from '@/repositories/seed-repository';
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

export async function findSeedById(seedId: string): Promise<Seed | null> {
  return getSeedRepository().findById(seedId);
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

  // 発信リンク: このシードが参照している他のシード
  const outgoingLinks: SeedLink[] = (
    await Promise.all(
      (seed.linkedActivityIds ?? []).map(async (id) => {
        const linked = await getSeedRepository().findById(id);
        if (!linked) return null;
        const linkedFace = await findFaceById(linked.faceId);
        return linkedFace ? { seed: linked, face: linkedFace } : null;
      })
    )
  ).filter((x): x is SeedLink => x !== null);

  // 被リンク: このシードを参照している他のシード
  const incomingLinks: SeedLink[] = (
    await Promise.all(
      allSeeds
        .filter((a) => a.id !== seed.id && (a.linkedActivityIds ?? []).includes(seed.id))
        .map(async (a) => {
          const linkedFace = await findFaceById(a.faceId);
          return linkedFace ? { seed: a, face: linkedFace } : null;
        })
    )
  ).filter((x): x is SeedLink => x !== null);

  return { seed, face, author, isOwner, outgoingLinks, incomingLinks, users };
}
