import 'server-only';

import type { ApiResult } from '@/lib/api-error';
import type { UploadedFile } from '@/types/file-storage';
import { getFileStorageRepository } from '@/repositories/file-storage-repository';
import { getAuthSession } from './auth';

/** ログイン中の自分の名義でファイルをアップロードする */
export async function uploadMyFile(file: File): Promise<ApiResult<UploadedFile>> {
  const session = await getAuthSession();
  if (!session) {
    return { success: false, errorKind: 'UNAUTHORIZED' };
  }
  return await getFileStorageRepository().uploadFile(session.accessToken, file);
}

/**
 * ログイン中の自分がアップロードしたファイルを削除する。
 * 未保存のまま終わったアップロードの後始末（ベストエフォート）に使う。
 */
export async function deleteMyFile(fileId: string): Promise<ApiResult<void>> {
  const session = await getAuthSession();
  if (!session) {
    return { success: false, errorKind: 'UNAUTHORIZED' };
  }
  return await getFileStorageRepository().deleteFile(session.accessToken, fileId);
}
