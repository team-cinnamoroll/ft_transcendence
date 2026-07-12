'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { CreateSeedRequestSchema, UpdateSeedRequestSchema } from '@tracen/contracts';
import type { Seed } from '@/types/seed';
import {
  createSeedForCurrentUser,
  updateSeedForCurrentUser,
  deleteSeedForCurrentUser,
} from '@/server/usecases/seeds';
import { buildZodErrorMap } from '@/lib/zod-error-map';
import type { ActionResult } from './result';

export async function createSeedAction(input: unknown): Promise<ActionResult<Seed>> {
  const t = await getTranslations('validation');
  const parsed = CreateSeedRequestSchema.safeParse(input, { error: buildZodErrorMap(t) });
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const seed = await createSeedForCurrentUser(parsed.data);

  revalidatePath('/');

  return { success: true, data: seed };
}

export async function updateSeedAction(
  seedId: string,
  input: unknown
): Promise<ActionResult<Seed>> {
  const t = await getTranslations('validation');
  const parsed = UpdateSeedRequestSchema.safeParse(input, { error: buildZodErrorMap(t) });
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const seed = await updateSeedForCurrentUser(seedId, parsed.data);

  revalidatePath('/');

  return { success: true, data: seed };
}

export async function deleteSeedAction(seedId: string): Promise<ActionResult<void>> {
  await deleteSeedForCurrentUser(seedId);

  revalidatePath('/');

  return { success: true, data: undefined };
}
