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
  users: UserProfile[];
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
  const currentUser = await getCurrentUser();
  return getSeedRepository().create(accessToken, currentUser.id, input);
}

export async function updateSeedForCurrentUser(
  seedId: string,
  input: UpdateSeedInput
): Promise<Seed> {
  const accessToken = await requireAccessToken();
  const currentUser = await getCurrentUser();

  // バックエンドのPUTレスポンスには更新後の本体が含まれず、
  // UpdateSeedInputにはfaceId/createdAtが含まれないため、
  // 更新前に既存のSeedを取得しておき、Repository層が返す不完全な値をここで補完する(#321参照)。
  const existing = await getSeedRepository().findById(accessToken, seedId);
  const updated = await getSeedRepository().update(accessToken, seedId, currentUser.id, input);

  if (!existing) {
    return updated;
  }
  return {
    ...updated,
    faceId: existing.faceId,
    createdAt: existing.createdAt,
    images: existing.images,
  };
}

export async function deleteSeedForCurrentUser(seedId: string): Promise<void> {
  const accessToken = await requireAccessToken();
  const currentUser = await getCurrentUser();
  return getSeedRepository().delete(accessToken, seedId, currentUser.id);
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

  const [author, users] = await Promise.all([findUserById(seed.userId), listAllUsers()]);

  // Seedは本物のバックエンドAPIに接続済みのため、モックID(currentUser.id)ではなく
  // 本物のログインID(session.userId)で所有者判定する必要がある(#314で発覚した不整合と同種、#318で解消予定)
  const isOwner = seed.userId === session.userId;

  return { seed, face, author, isOwner, users };
}
