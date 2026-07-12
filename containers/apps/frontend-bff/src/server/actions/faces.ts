'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { CreateFaceRequestSchema, UpdateFaceRequestSchema } from '@tracen/contracts';
import type { Face } from '@/types/face';
import {
  createFaceForCurrentUser,
  updateFaceForCurrentUser,
  deleteFaceForCurrentUser,
} from '@/server/usecases/faces';
import { buildZodErrorMap } from '@/lib/zod-error-map';
import type { ActionResult } from './result';

export async function createFaceAction(input: unknown): Promise<ActionResult<Face>> {
  const t = await getTranslations('validation');
  const parsed = CreateFaceRequestSchema.safeParse(input, { error: buildZodErrorMap(t) });
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
  const t = await getTranslations('validation');
  const parsed = UpdateFaceRequestSchema.safeParse(input, { error: buildZodErrorMap(t) });
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
