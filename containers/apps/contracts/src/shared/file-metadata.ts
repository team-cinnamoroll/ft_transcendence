import { z } from 'zod';

export const FileMetadataIdSchema = z.uuid();
export type FileMetadataId = z.infer<typeof FileMetadataIdSchema>;

export const FileUrlSchema = z.union([z.url(), z.string().startsWith('/')]);
export type FileUrl = z.infer<typeof FileUrlSchema>;

export const FileSchema = z
  .object({
    id: FileMetadataIdSchema,
    url: FileUrlSchema,
  })
  .strict();
export type File = z.infer<typeof FileSchema>;
