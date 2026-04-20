'use server';

import { revalidatePath } from 'next/cache';

import type { CreateFaceInput } from '@/repositories/face-repository';
import { createFaceForCurrentUser } from '@/server/usecases/faces';

export async function createFaceAction(input: CreateFaceInput) {
  const face = await createFaceForCurrentUser(input);

  revalidatePath('/');
  revalidatePath('/faces');

  return face;
}
