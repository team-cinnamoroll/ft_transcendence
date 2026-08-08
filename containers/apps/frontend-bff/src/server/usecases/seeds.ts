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
import { findUserById } from './users';
import { getSessionTokens } from '@/lib/session';
import { getAuthSession } from './auth';

export type SeedLink = {
  seed: Seed;
  face: Face;
};

export type SeedDetailData = {
  seed: Seed;
  face: Face;
  author: UserProfile | null;
  isOwner: boolean;
};

async function requireAccessToken(): Promise<string> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return accessToken;
}

export async function listSeedsByUserId(userId: string): Promise<Seed[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return getSeedRepository().listByUserId(accessToken, userId);
}

export async function listSeedsByFaceId(faceId: string): Promise<Seed[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return getSeedRepository().listByFaceId(accessToken, faceId);
}

export async function listAllSeeds(): Promise<Seed[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return getSeedRepository().listAll(accessToken);
}

/**
 * キーワードでシードを検索する。
 * userIdを指定すると対象ユーザーのシードのみに絞り込める(未指定なら全体)。
 */
export async function searchSeeds(query: { q?: string; userId?: string }): Promise<Seed[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return getSeedRepository().search(accessToken, query);
}

export async function listSeedsByFaceIds(faceIds: string[]): Promise<Seed[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return getSeedRepository().listByFaceIds(accessToken, faceIds);
}

export async function findSeedById(seedId: string): Promise<Seed | null> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return null;
  }
  return getSeedRepository().findById(accessToken, seedId);
}

export async function createSeedForCurrentUser(input: CreateSeedInput): Promise<Seed> {
  const accessToken = await requireAccessToken();
  return getSeedRepository().create(accessToken, input);
}

export async function updateSeedForCurrentUser(
  seedId: string,
  input: UpdateSeedInput
): Promise<Seed> {
  const accessToken = await requireAccessToken();
  return getSeedRepository().update(accessToken, seedId, input);
}

export async function deleteSeedForCurrentUser(seedId: string): Promise<void> {
  const accessToken = await requireAccessToken();
  return getSeedRepository().delete(accessToken, seedId);
}

export async function getSeedDetailData(seedId: string): Promise<SeedDetailData | null> {
  const session = await getAuthSession();
  if (!session) {
    return null;
  }
  const seed = await getSeedRepository().findById(session.accessToken, seedId);
  if (!seed) return null;

  const face = await findFaceById(seed.faceId);
  if (!face) return null;

  const author = await findUserById(seed.userId);

  const isOwner = seed.userId === session.userId;

  return { seed, face, author, isOwner };
}
