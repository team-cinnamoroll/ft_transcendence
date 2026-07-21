import type { FileUploadResponse } from '@tracen/contracts';

export type {
  FileUploadResponse as FileUpload,
  FileDeleteResponse as FileDelete,
} from '@tracen/contracts';

/** アップロード成功時にbackendから返されるファイル情報（fileId/filePath） */
export type UploadedFile = Extract<FileUploadResponse, { success: true }>['data'];
