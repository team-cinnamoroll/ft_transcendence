'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import { CreateFaceRequestSchema, UpdateFaceRequestSchema } from '@tracen/contracts';
import type { Face } from '@/types/face';
import {
  createFaceForCurrentUser,
  updateFaceForCurrentUser,
  deleteFaceForCurrentUser,
} from '@/server/usecases/faces';
import type { ActionResult } from './result';

export async function createFaceAction(input: unknown): Promise<ActionResult<Face>> {
  const parsed = CreateFaceRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const face = await createFaceForCurrentUser(parsed.data);

  revalidatePath('/');
  revalidatePath('/faces');

  return { success: true, data: face };
}

export async function updateFaceAction(
  faceId: string,
  input: unknown
): Promise<ActionResult<Face>> {
  const parsed = UpdateFaceRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const face = await updateFaceForCurrentUser(faceId, parsed.data);

  revalidatePath('/');
  revalidatePath('/faces');
  revalidatePath(`/faces/${faceId}`);

  return { success: true, data: face };
}

export async function deleteFaceAction(faceId: string): Promise<ActionResult<void>> {
  await deleteFaceForCurrentUser(faceId);

  revalidatePath('/');
  revalidatePath('/faces');

  return { success: true, data: undefined };
}
