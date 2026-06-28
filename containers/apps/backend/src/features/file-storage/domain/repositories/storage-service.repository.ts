import { z } from 'zod';
import {
  MimeTypeSchema,
  FileSizeSchema,
  type Visibility,
  type FilePath,
  type FileMetadataId,
} from '@tracen/contracts';
import {
  type BucketNameType,
  type StorageKey,
  BucketNameTypeSchema,
  StorageKeySchema,
} from '../file-metadata.entity';
import { type StorageDataInput } from '../file-storage.file-save.request';

export const UploadOptionsSchema = z.object({
  bucket: BucketNameTypeSchema, // S3のバケット名、ローカルならルートフォルダ名（例: 'public-bucket', 'private-bucket'）
  storageKey: StorageKeySchema, // ファイルのパス（例: 'avatars/user-123.png'）
  mimeType: MimeTypeSchema, // image/png など
  contentLength: FileSizeSchema.optional(), // ストリーム転送時に指定するとS3等で効率的
});
export type UploadOptions = z.infer<typeof UploadOptionsSchema>;

export interface FileStoragesServiceRepositorySpec {
  /**
   * ファイルを保存する（Buffer と ReadableStream の両方を柔軟に受け付ける）
   */
  save(options: UploadOptions, data: StorageDataInput): Promise<void>;

  /**
   * ファイルを取得する（メモリ節約のため、戻り値は常に ReadableStream に統一）
   */
  get(bucket: BucketNameType, storageKey: StorageKey): Promise<ReadableStream<Uint8Array> | null>;

  /**
   * ファイルを削除する
   */
  delete(bucket: BucketNameType, storageKey: StorageKey): Promise<void>;

  /**
   * パブリックアクセス用のURL、または一時的な署名付きURLを解決する
   */
  resolveUrl(
    bucket: BucketNameType,
    storageKey: StorageKey,
    fileId: FileMetadataId,
    visibility: Visibility
  ): Promise<FilePath>;
}
