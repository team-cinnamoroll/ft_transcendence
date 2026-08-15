import 'server-only';

import type { FileUpload, UploadedFile } from '@/types/file-storage';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';
import { classifyHttpStatus, type ApiResult } from '@/lib/api-error';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** FileStorageRepository が提供するメソッドの契約（Spec） */
export type FileStorageRepositorySpec = {
  /** ファイルをアップロードする（公開バケットに保存） */
  uploadFile: (accessToken: string, file: File) => Promise<ApiResult<UploadedFile>>;
  /** アップロード済みファイルを削除する */
  deleteFile: (accessToken: string, fileId: string) => Promise<ApiResult<void>>;
};

// ─── バックエンドAPI実装 ────────────────────────────────────────
// ログイン中の本人のアップロード操作にしか意味がないデータのため、他の repository と異なり
// モック実装は用意せず、最初からバックエンドAPIを呼ぶ実装のみを提供する（auth-repository.ts と同じ考え方）。

export function createFileStorageApiRepositoryImpl(): FileStorageRepositorySpec {
  return {
    uploadFile: async (accessToken, file) => {
      try {
        // POST /file-storage/upload はJSONではなく、ヘッダー+バイナリbodyという特殊な形式
        // HTTPヘッダーの値はASCII(ByteString)である必要があるため、日本語等を含むファイル名は
        // encodeURIComponentしてから設定する(fileNameはDB保存用メタデータでしかなく、
        // フロントエンドからは参照されていないためデコードは不要)
        const res = await createBackendClient(accessToken).api.v1['file-storage'].upload.$post(
          {
            header: {
              'x-file-name': encodeURIComponent(file.name),
              'x-file-type': file.type as import('@tracen/contracts').MimeType,
              'content-length': String(file.size),
              'x-visibility': 'public',
            },
          },
          { init: { body: file } }
        );
        if (!res.ok) {
          console.error('FileStorageRepository.uploadFile: backend request failed', res.status);
          return { success: false, errorKind: classifyHttpStatus(res.status) };
        }
        const json = (await res.json()) as FileUpload;
        if (!json.success) {
          return { success: false, errorKind: classifyHttpStatus(res.status) };
        }
        return { success: true, data: json.data };
      } catch (error) {
        // バックエンドがストリームを早期中断した場合の fetch failed などを捕捉
        console.error('FileStorageRepository.uploadFile: network error or fetch failed', error);
        return { success: false, errorKind: 'BAD_REQUEST' };
      }
    },

    deleteFile: async (accessToken, fileId) => {
      const res = await createBackendClient(accessToken).api.v1['file-storage'].delete[
        ':fileId'
      ].$delete({
        param: { fileId },
      });
      if (!res.ok) {
        console.error('FileStorageRepository.deleteFile: backend request failed', res.status);
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      return { success: true, data: undefined };
    },
  };
}

export const fileStorageApiRepositoryImpl: FileStorageRepositorySpec =
  createFileStorageApiRepositoryImpl();

/** Provider: DI の入口（実装の選択はここに閉じ込める） */
export const getFileStorageRepository = createSingletonProvider<FileStorageRepositorySpec>(
  () => fileStorageApiRepositoryImpl
);
