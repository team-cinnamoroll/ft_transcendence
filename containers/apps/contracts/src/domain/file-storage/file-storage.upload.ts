import { z } from 'zod';
import { FilePathSchema } from '../../shared/primitives';
import { createApiResponseSchema } from '../../shared/response';
import { FileMetadataIdSchema } from '../../shared/file-metadata';

const FileUploadResponseDataSchema = z
  .object({
    fileId: FileMetadataIdSchema,
    filePath: FilePathSchema,
  })
  .strict();

export const FileUploadResponseSchema = createApiResponseSchema(FileUploadResponseDataSchema);
export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;
