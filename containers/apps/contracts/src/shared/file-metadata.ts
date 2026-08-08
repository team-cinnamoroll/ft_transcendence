import { z } from 'zod';

export const FileMetadataIdSchema = z.uuid();
export type FileMetadataId = z.infer<typeof FileMetadataIdSchema>;

export const FileUrlSchema = z.union([z.url(), z.string().startsWith('/')]);
export type FileUrl = z.infer<typeof FileUrlSchema>;

export const FileNameSchema = z.string().min(1).max(255);
export type FileName = z.infer<typeof FileNameSchema>;

export const MimeTypeSchema = z.string().min(1).max(255);
export type MimeType = z.infer<typeof MimeTypeSchema>;

export const FileSchema = z
  .object({
    id: FileMetadataIdSchema,
    url: FileUrlSchema,
    // Seedの添付ファイル(PDF等)を画像と区別して表示するために使う。
    // Face/UserProfileのmapperは対応していないため、常に値がある保証はない(#349)。
    fileName: FileNameSchema.optional(),
    mimeType: MimeTypeSchema.optional(),
  })
  .strict();
export type File = z.infer<typeof FileSchema>;
