import mime from 'mime';

import { FilePath, Visibility, FileMetadataId, MimeType } from '@tracen/contracts';
import {
  type BucketNameType,
  type StorageKey,
  BucketNameTypeSchema,
  StorageKeySchema,
} from '../domain/file-metadata.entity';
import { FileUrlGeneratorSpec } from '../domain/file-url-generator';

const PublicBucketName: BucketNameType = 'public-bucket';
const PrivateBucketName: BucketNameType = 'private-bucket';

class FileURLGeneratorImpl implements FileUrlGeneratorSpec {
  getBucketName(visibility: Visibility): BucketNameType {
    if (visibility === 'public') {
      return BucketNameTypeSchema.parse(PublicBucketName);
    } else {
      return BucketNameTypeSchema.parse(PrivateBucketName);
    }
  }

  getStorageKey(fileMetadataId: FileMetadataId, mimeType: MimeType): StorageKey {
    const fileExtension = mime.getExtension(mimeType) ?? 'bin';
    return StorageKeySchema.parse(`${fileMetadataId}.${fileExtension}`);
  }

  generateFileUrl(
    bucket: BucketNameType,
    storageKey: StorageKey,
    fileId: FileMetadataId
  ): FilePath {
    if (bucket === PublicBucketName) {
      // 【パブリックアクセス】
      // Honoの静的ファイルサーブ（hono/serve-static）のエンドポイントURLを返す
      // 例: /static/public-bucket/avatars/user-123.png
      return `/static/${bucket}/${storageKey}`;
    } else if (bucket === PrivateBucketName) {
      // 【プライベートアクセス（認証必須）】
      // 直接ファイルを返さず、必ずHonoの認可ミドルウェアを通るAPIのパスを返す
      // 例: /api/v1/file-storage/download/file-123
      return `/api/v1/file-storage/download/${fileId}`;
    } else {
      throw new Error(`Unknown bucket name: ${bucket}`);
    }
  }
}

export function createFileUrlGenerator(): FileUrlGeneratorSpec {
  return new FileURLGeneratorImpl();
}
