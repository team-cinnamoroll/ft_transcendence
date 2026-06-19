'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import { CreateSeedRequestSchema } from '@tracen/contracts';
import type { Seed } from '@/types/seed';
import { createSeedForCurrentUser } from '@/server/usecases/seeds';
import type { ActionResult } from './result';

export async function createSeedAction(input: unknown): Promise<ActionResult<Seed>> {
  const parsed = CreateSeedRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const seed = await createSeedForCurrentUser(parsed.data);

  revalidatePath('/');

  return { success: true, data: seed };
}
