import { z } from 'zod';

import {
  FileNameSchema,
  MimeTypeSchema,
  VisibilitySchema,
  FileSizeSchema,
} from '@tracen/contracts';
import { OwnerIdSchema } from './file-metadata.entity';

export const StorageDataInputSchema = z.union([
  z.instanceof(Buffer),
  z.instanceof(ReadableStream<Uint8Array>),
]);
export type StorageDataInput = z.infer<typeof StorageDataInputSchema>;

export const FileSaveRequestSchema = z.object({
  ownerId: OwnerIdSchema,
  fileName: FileNameSchema,
  mimeType: MimeTypeSchema,
  fileSize: FileSizeSchema,
  inputData: StorageDataInputSchema,
  visibility: VisibilitySchema,
});
export type FileSaveRequest = z.infer<typeof FileSaveRequestSchema>;
