import mime from 'mime';

import { FilePath, FilePathSchema, Visibility, FileMetadataId, MimeType } from '@tracen/contracts';
import {
  type BucketNameType,
  type StorageKey,
  BucketNameTypeSchema,
  StorageKeySchema,
} from '../domain/file-metadata.entity';
import { FileUrlGeneratorSpec } from '../domain/file-url-generator';
import { makeSafeInfraResult } from '../../../shared/utils/validation';

const PublicBucketName: BucketNameType = 'public-bucket';
const PrivateBucketName: BucketNameType = 'private-bucket';

class FileURLGeneratorImpl implements FileUrlGeneratorSpec {
  getBucketName(visibility: Visibility): BucketNameType {
    if (visibility === 'public') {
      return makeSafeInfraResult(BucketNameTypeSchema, PublicBucketName);
    } else {
      return makeSafeInfraResult(BucketNameTypeSchema, PrivateBucketName);
    }
  }

  getStorageKey(fileMetadataId: FileMetadataId, mimeType: MimeType): StorageKey {
    const fileExtension = mime.getExtension(mimeType) ?? 'bin';
    return makeSafeInfraResult(StorageKeySchema, `${fileMetadataId}.${fileExtension}`);
  }

  generateFileUrl(
    bucket: BucketNameType,
    storageKey: StorageKey,
    fileId: FileMetadataId
  ): FilePath {
    switch (bucket) {
      case PublicBucketName:
        // 【パブリックアクセス】
        // Honoの静的ファイルサーブ（hono/serve-static）のエンドポイントURLを返す
        // 例: /static/public-bucket/avatars/user-123.png
        return makeSafeInfraResult(FilePathSchema, `/static/${bucket}/${storageKey}`);
      case PrivateBucketName:
        // 【プライベートアクセス（認証必須）】
        // 直接ファイルを返さず、必ずHonoの認可ミドルウェアを通るAPIのパスを返す
        // 例: /api/v1/file-storage/download/file-123
        return makeSafeInfraResult(FilePathSchema, `/api/v1/file-storage/download/${fileId}`);
      default:
        throw new Error(`Unknown bucket name: ${bucket}`);
    }
  }
}

export function createFileUrlGenerator(): FileUrlGeneratorSpec {
  return new FileURLGeneratorImpl();
}
