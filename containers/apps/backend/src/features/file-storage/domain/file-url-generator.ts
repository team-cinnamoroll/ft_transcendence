import { FilePath, Visibility, MimeType, FileMetadataId } from '@tracen/contracts';
import { BucketNameType, StorageKey } from '../domain/file-metadata.entity';

export interface FileUrlGeneratorSpec {
  getBucketName(visibility: Visibility): BucketNameType;
  getStorageKey(fileMetadataId: FileMetadataId, mimeType: MimeType): StorageKey;
  generateFileUrl(bucket: BucketNameType, storageKey: StorageKey, fileId: FileMetadataId): FilePath;
}
