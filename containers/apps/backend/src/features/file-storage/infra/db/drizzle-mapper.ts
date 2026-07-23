import { BucketNameTypeSchema, FileMetadataSchema } from '../../domain/file-metadata.entity';
import type { FileMetadata } from '../../domain/file-metadata.entity';
import { type FileMetadataRow } from './schema';
import { makeSafeInfraResult } from '../../../../shared/utils/validation';

export function mapFileMetadata(row: FileMetadataRow): FileMetadata {
  return makeSafeInfraResult(FileMetadataSchema, {
    id: row.id,
    ownerId: row.ownerId,
    bucket: makeSafeInfraResult(BucketNameTypeSchema, row.bucket),
    storageKey: row.storageKey,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
  });
}
