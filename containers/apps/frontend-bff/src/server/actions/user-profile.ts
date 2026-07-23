'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { UserProfileUpsertRequestSchema } from '@tracen/contracts';
import type { ApiErrorKind } from '@/lib/api-error';
import type { SimpleApi } from '@/types/api';
import { updateMyProfile } from '@/server/usecases/users';
import { getAuthSession } from '@/server/usecases/auth';
import { buildZodErrorMap } from '@/lib/zod-error-map';
import type { ActionResult } from './result';

/**
 * プロフィール保存失敗時の errorKind を、i18n対応した表示文言に変換する。
 *
 * PUT /user-profile/:userId が実際に返しうる errorKind:
 * - VALIDATION(400): userIdが空（通常発生しない防御的チェック）
 * - UNAUTHORIZED(401): JWTが無効・欠落している（セッション切れ）
 * - FORBIDDEN(403): URLのuserIdとJWTのsubが不一致（フロントの実装が正しい限り発生しない）
 * - SERVER_ERROR(500)/UNKNOWN: 予期しないエラー
 *
 * ユーザーが次に取るべき行動が変わるのは UNAUTHORIZED のみ（再ログインが必要）。
 * それ以外は「もう一度試す」以外に取れる行動が無いため、共通の errorGeneric にまとめる。
 */
function resolveUpdateProfileErrorMessage(
  t: Awaited<ReturnType<typeof getTranslations>>,
  errorKind: ApiErrorKind
): string {
  if (errorKind === 'UNAUTHORIZED') {
    return t('errorSessionExpired');
  }
  return t('errorGeneric');
}

export async function updateUserProfileAction(input: unknown): Promise<ActionResult<SimpleApi>> {
  const t = await getTranslations('validation');
  const parsed = UserProfileUpsertRequestSchema.safeParse(input, { error: buildZodErrorMap(t) });
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const tProfile = await getTranslations('profileEditModal');

  const session = await getAuthSession();
  if (!session) {
    return { success: true, data: { success: false, message: tProfile('errorSessionExpired') } };
  }

  const result = await updateMyProfile(session.userId, session.accessToken, parsed.data);
  if (!result.success) {
    return {
      success: true,
      data: {
        success: false,
        message: resolveUpdateProfileErrorMessage(tProfile, result.errorKind),
      },
    };
  }

  revalidatePath('/settings');
  revalidatePath('/', 'layout');

  return { success: true, data: { success: true } };
}
