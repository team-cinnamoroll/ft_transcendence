import { z } from 'zod';

import { FilePathSchema } from '../../shared/primitives';
import { SuccessResponseSchema } from '../../shared/response';

export const FileMetadataIdSchema = z.uuid();
export type FileMetadataId = z.infer<typeof FileMetadataIdSchema>;

export const FileUploadResponseSchema = SuccessResponseSchema.extend({
  fileId: FileMetadataIdSchema.optional(),
  filePath: FilePathSchema.optional(),
}).strict();
