'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import { CreateFaceRequestSchema } from '@tracen/contracts';
import type { Face } from '@/types/face';
import { createFaceForCurrentUser } from '@/server/usecases/faces';
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
