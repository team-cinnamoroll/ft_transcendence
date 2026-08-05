import 'server-only';

import type { Face } from '@/types/face';
import {
  type CreateFaceInput,
  type UpdateFaceInput,
  getFaceRepository,
} from '@/repositories/face-repository';
import { getSessionTokens } from '@/lib/session';
import { getCurrentUser } from './users';

export async function listFacesByUserId(userId: string): Promise<Face[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return await getFaceRepository().listByUserId(accessToken, userId);
}

export async function listAllFaces(): Promise<Face[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return await getFaceRepository().listAll(accessToken);
}

export async function findFaceById(faceId: string): Promise<Face | null> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return null;
  }
  return await getFaceRepository().findById(accessToken, faceId);
}

export async function createFace(userId: string, input: CreateFaceInput): Promise<Face> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('createFace: not authenticated');
  }
  return await getFaceRepository().create(accessToken, userId, input);
}

export async function createFaceForCurrentUser(input: CreateFaceInput): Promise<Face> {
  const currentUser = await getCurrentUser();
  return await createFace(currentUser.id, input);
}

export async function updateFace(
  faceId: string,
  userId: string,
  input: UpdateFaceInput
): Promise<Face> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('updateFace: not authenticated');
  }

  // UpdateFaceRequest には visibility が含まれない(作成後は変更不可のため)。
  // Repository層は visibility にプレースホルダーを入れて返すため、ここで既存の値に補完する。
  const existing = await getFaceRepository().findById(accessToken, faceId);
  const updated = await getFaceRepository().update(accessToken, faceId, userId, input);

  if (!existing) {
    return updated;
  }
  return { ...updated, visibility: existing.visibility };
}

export async function updateFaceForCurrentUser(
  faceId: string,
  input: UpdateFaceInput
): Promise<Face> {
  const currentUser = await getCurrentUser();
  return await updateFace(faceId, currentUser.id, input);
}

export async function deleteFace(faceId: string, userId: string): Promise<void> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('deleteFace: not authenticated');
  }
  return await getFaceRepository().delete(accessToken, faceId, userId);
}

export async function deleteFaceForCurrentUser(faceId: string): Promise<void> {
  const currentUser = await getCurrentUser();
  return await deleteFace(faceId, currentUser.id);
}
