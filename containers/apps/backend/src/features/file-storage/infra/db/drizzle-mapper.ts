import { BucketNameTypeSchema } from '../../domain/file-metadata.entity';
import type { FileMetadata } from '../../domain/file-metadata.entity';
import { type FileMetadataRow } from './schema';

export function mapFileMetadata(row: FileMetadataRow): FileMetadata {
  return {
    id: row.id,
    ownerId: row.ownerId,
    bucket: BucketNameTypeSchema.parse(row.bucket),
    storageKey: row.storageKey,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
  };
}
