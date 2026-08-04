'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { CreateFaceRequestSchema, UpdateFaceRequestSchema } from '@tracen/contracts';
import type { Face } from '@/types/face';
import type { ApiErrorKind } from '@/lib/api-error';
import {
  createFaceForCurrentUser,
  updateFaceForCurrentUser,
  deleteFaceForCurrentUser,
} from '@/server/usecases/faces';
import { uploadMyFile } from '@/server/usecases/file-storage';
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

type UploadFaceImageResult =
  { success: true; fileId: string } | { success: false; message: string };

/**
 * アップロード失敗時の errorKind を、i18n対応した表示文言に変換する。
 * `uploadAvatarFileAction`(file-storage.ts)と同じ考え方だが、
 * Face作成/編集モーダル共通の名前空間(faceImageUpload)を使う。
 */
function resolveFaceImageUploadErrorMessage(
  t: Awaited<ReturnType<typeof getTranslations>>,
  errorKind: ApiErrorKind
): string {
  if (errorKind === 'UNAUTHORIZED') {
    return t('errorSessionExpired');
  }
  return t('errorUploadFailed');
}

/** Face作成/編集モーダルの画像アップロード用Server Action */
export async function uploadFaceImageAction(
  formData: FormData
): Promise<ActionResult<UploadFaceImageResult>> {
  const file = formData.get('file');
  const t = await getTranslations('faceImageUpload');

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, errors: { file: [t('errorUploadFailed')] } };
  }

  const result = await uploadMyFile(file);
  if (!result.success) {
    return {
      success: true,
      data: { success: false, message: resolveFaceImageUploadErrorMessage(t, result.errorKind) },
    };
  }

  return { success: true, data: { success: true, fileId: result.data.fileId } };
}
