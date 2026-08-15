/**
 * @/server/actions/file-storage のモック。
 * Storybook 環境では 'use server' / next/cache が使えないため、
 * 本物の server/actions/file-storage.ts と同じ関数名・戻り値の形(ActionResult)を持つ偽実装で置き換える。
 */
import type { ActionResult } from '../../src/server/actions/result';

type UploadFileResult = { success: true; fileId: string } | { success: false; message: string };

export async function uploadAvatarFileAction(): Promise<ActionResult<UploadFileResult>> {
  return {
    success: true,
    data: { success: true, fileId: `mock-avatar-file-${Date.now()}` },
  };
}

export async function deleteUploadedFileAction(): Promise<void> {
  return;
}
