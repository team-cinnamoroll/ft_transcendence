import { z } from 'zod';

export const FileMetadataIdSchema = z.uuid();
export type FileMetadataId = z.infer<typeof FileMetadataIdSchema>;

export const FileUrlSchema = z.union([z.string().url(), z.string().startsWith('/')]);
export type FileUrl = z.infer<typeof FileUrlSchema>;
