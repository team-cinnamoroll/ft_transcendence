import { z } from 'zod';

import { FileMetadataIdSchema } from '../../shared/file-metadata';

export const FileDeleteRequestSchema = z.object({
  fileId: FileMetadataIdSchema.optional(),
});

export type FileDeleteRequest = z.infer<typeof FileDeleteRequestSchema>;
