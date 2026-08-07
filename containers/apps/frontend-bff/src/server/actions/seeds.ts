'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { CreateSeedRequestSchema, UpdateSeedRequestSchema } from '@tracen/contracts';
import type { Seed } from '@/types/seed';
import type { ApiErrorKind } from '@/lib/api-error';
import {
  createSeedForCurrentUser,
  updateSeedForCurrentUser,
  deleteSeedForCurrentUser,
} from '@/server/usecases/seeds';
import { uploadMyFile } from '@/server/usecases/file-storage';
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

type UploadSeedImageResult =
  { success: true; fileId: string } | { success: false; message: string };

/**
 * アップロード失敗時の errorKind を、i18n対応した表示文言に変換する。
 * `uploadFaceImageAction`(faces.ts)と同じ考え方だが、Seed投稿モーダル用の名前空間(seedImageUpload)を使う。
 */
function resolveSeedImageUploadErrorMessage(
  t: Awaited<ReturnType<typeof getTranslations>>,
  errorKind: ApiErrorKind
): string {
  if (errorKind === 'UNAUTHORIZED') {
    return t('errorSessionExpired');
  }
  return t('errorUploadFailed');
}

/** Seed投稿モーダルの画像アップロード用Server Action */
export async function uploadSeedImageAction(
  formData: FormData
): Promise<ActionResult<UploadSeedImageResult>> {
  const file = formData.get('file');
  const t = await getTranslations('seedImageUpload');

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, errors: { file: [t('errorUploadFailed')] } };
  }

  const result = await uploadMyFile(file);
  if (!result.success) {
    return {
      success: true,
      data: { success: false, message: resolveSeedImageUploadErrorMessage(t, result.errorKind) },
    };
  }

  return { success: true, data: { success: true, fileId: result.data.fileId } };
}
