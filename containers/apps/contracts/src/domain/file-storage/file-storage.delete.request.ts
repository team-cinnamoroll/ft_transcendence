import { z } from 'zod';

import { FileMetadataIdSchema } from './file-storage.upload';

export const FileDeleteRequestSchema = z.object({
  fileId: FileMetadataIdSchema.optional(),
});

export type FileDeleteRequest = z.infer<typeof FileDeleteRequestSchema>;
