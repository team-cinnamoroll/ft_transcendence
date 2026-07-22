'use server';

import { getTranslations } from 'next-intl/server';
import type { ApiErrorKind } from '@/lib/api-error';
import { uploadMyFile, deleteMyFile } from '@/server/usecases/file-storage';
import type { ActionResult } from './result';

type UploadFileResult = { success: true; fileId: string } | { success: false; message: string };

/**
 * アップロード失敗時の errorKind を、i18n対応した表示文言に変換する。
 *
 * POST /file-storage/upload が実際に返しうる errorKind:
 * - VALIDATION(400): ファイルサイズ超過・ヘッダー不正など
 * - UNAUTHORIZED(401): セッション切れ
 * - SERVER_ERROR(500)/UNKNOWN: 予期しないエラー
 *
 * ユーザーが次に取るべき行動が変わるのは UNAUTHORIZED のみ（再ログインが必要）。
 * それ以外は「もう一度試す」以外に取れる行動が無いため、共通の errorGeneric にまとめる。
 */
function resolveUploadErrorMessage(
  t: Awaited<ReturnType<typeof getTranslations>>,
  errorKind: ApiErrorKind
): string {
  if (errorKind === 'UNAUTHORIZED') {
    return t('errorSessionExpired');
  }
  return t('errorAvatarUploadFailed');
}

export async function uploadAvatarFileAction(
  formData: FormData
): Promise<ActionResult<UploadFileResult>> {
  const file = formData.get('file');
  const t = await getTranslations('profileEditModal');

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, errors: { file: [t('errorAvatarUploadFailed')] } };
  }

  const result = await uploadMyFile(file);
  if (!result.success) {
    return {
      success: true,
      data: { success: false, message: resolveUploadErrorMessage(t, result.errorKind) },
    };
  }

  return { success: true, data: { success: true, fileId: result.data.fileId } };
}

/**
 * 未保存のまま終わったアップロード済みファイルを削除する（ベストエフォート）。
 * モーダルを保存せずに閉じたとき／画像を選び直したときに呼ぶ。
 */
export async function deleteUploadedFileAction(fileId: string): Promise<void> {
  const result = await deleteMyFile(fileId);
  if (!result.success) {
    console.error('deleteUploadedFileAction: failed to delete file', fileId, result.errorKind);
  }
}
