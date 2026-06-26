import { z } from 'zod';

import {
  FileNameSchema,
  MimeTypeSchema,
  FileMetadataIdSchema,
  FileSizeSchema,
} from '@tracen/contracts';

export const OwnerIdSchema = z.uuid();
export type OwnerId = z.infer<typeof OwnerIdSchema>;

export const BucketNameTypeSchema = z.enum(['public-bucket', 'private-bucket']);
export type BucketNameType = z.infer<typeof BucketNameTypeSchema>;

export const StorageKeySchema = z.string().min(1).max(1024);
export type StorageKey = z.infer<typeof StorageKeySchema>;

export const FileMetadataSchema = z.object({
  id: FileMetadataIdSchema,
  ownerId: OwnerIdSchema,
  bucket: BucketNameTypeSchema,
  storageKey: StorageKeySchema,
  fileName: FileNameSchema,
  mimeType: MimeTypeSchema,
  fileSize: FileSizeSchema,
});
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
