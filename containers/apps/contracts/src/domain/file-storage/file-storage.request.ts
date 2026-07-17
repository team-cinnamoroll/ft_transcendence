import { z } from 'zod';

import { FileMetadataIdSchema } from '../../shared/file-metadata';

export const FileRequestSchema = z.object({
  fileId: FileMetadataIdSchema,
});

export type FileRequest = z.infer<typeof FileRequestSchema>;
