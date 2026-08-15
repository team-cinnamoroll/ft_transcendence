import {
  BucketNameTypeSchema,
  FileMetadataSchema,
  type BucketNameType,
} from '../../domain/file-metadata.entity';
import type { FileMetadata } from '../../domain/file-metadata.entity';
import { type FileMetadataRow } from './schema';
import { makeSafeInfraResult } from '../../../../shared/utils/validation';

import type { MimeType } from '@tracen/contracts';

export function mapFileMetadata(row: FileMetadataRow): FileMetadata {
  return makeSafeInfraResult(FileMetadataSchema, {
    id: row.id,
    ownerId: row.ownerId,
    bucket: makeSafeInfraResult(BucketNameTypeSchema, row.bucket as BucketNameType),
    storageKey: row.storageKey,
    fileName: row.fileName,
    mimeType: row.mimeType as MimeType,
    fileSize: row.fileSize,
  });
}
