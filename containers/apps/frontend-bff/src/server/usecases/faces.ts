import 'server-only';

import type { Face } from '@/types/face';
import {
  type CreateFaceInput,
  type UpdateFaceInput,
  getFaceRepository,
} from '@/repositories/face-repository';
import { getSessionTokens } from '@/lib/session';

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

export async function createFace(input: CreateFaceInput): Promise<Face> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('createFace: not authenticated');
  }
  return await getFaceRepository().create(accessToken, input);
}

export async function updateFace(faceId: string, input: UpdateFaceInput): Promise<Face> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('updateFace: not authenticated');
  }
  return await getFaceRepository().update(accessToken, faceId, input);
}

export async function deleteFace(faceId: string): Promise<void> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('deleteFace: not authenticated');
  }
  return await getFaceRepository().delete(accessToken, faceId);
}
