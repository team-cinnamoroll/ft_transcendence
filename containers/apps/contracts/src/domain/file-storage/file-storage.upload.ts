import { FilePathSchema } from '../../shared/primitives';
import { SuccessResponseSchema } from '../../shared/response';
import { FileMetadataIdSchema } from '../../shared/file-metadata';

export const FileUploadResponseSchema = SuccessResponseSchema.extend({
  fileId: FileMetadataIdSchema.optional(),
  filePath: FilePathSchema.optional(),
}).strict();
