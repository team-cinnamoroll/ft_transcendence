import 'server-only';

import type { Face } from '@/types/face';
import { type CreateFaceInput, getFaceRepository } from '@/repositories/face-repository';
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
