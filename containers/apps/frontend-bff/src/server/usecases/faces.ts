import 'server-only';

import type { Face } from '@/types/face';
import { type CreateFaceInput, type UpdateFaceInput, getFaceRepository } from '@/repositories/face-repository';
import { getCurrentUser } from './users';

export async function listFacesByUserId(userId: string): Promise<Face[]> {
  return await getFaceRepository().listByUserId(userId);
}

export async function listAllFaces(): Promise<Face[]> {
  return await getFaceRepository().listAll();
}

export async function findFaceById(faceId: string): Promise<Face | null> {
  return await getFaceRepository().findById(faceId);
}

export async function createFace(userId: string, input: CreateFaceInput): Promise<Face> {
  return await getFaceRepository().create(userId, input);
}

export async function createFaceForCurrentUser(input: CreateFaceInput): Promise<Face> {
  const currentUser = await getCurrentUser();
  return await createFace(currentUser.id, input);
}

export async function updateFace(faceId: string, userId: string, input: UpdateFaceInput): Promise<Face> {
  return await getFaceRepository().update(faceId, userId, input);
}

export async function updateFaceForCurrentUser(faceId: string, input: UpdateFaceInput): Promise<Face> {
  const currentUser = await getCurrentUser();
  return await updateFace(faceId, currentUser.id, input);
}

export async function deleteFace(faceId: string, userId: string): Promise<void> {
  return await getFaceRepository().delete(faceId, userId);
}

export async function deleteFaceForCurrentUser(faceId: string): Promise<void> {
  const currentUser = await getCurrentUser();
  return await deleteFace(faceId, currentUser.id);
}
