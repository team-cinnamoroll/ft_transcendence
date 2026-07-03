import { z } from 'zod';

export const FileNameSchema = z.string().min(1).max(255);
export type FileName = z.infer<typeof FileNameSchema>;

export const MimeTypeSchema = z.string().min(1).max(255);
export type MimeType = z.infer<typeof MimeTypeSchema>;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const FileSizeSchema = z.number().int().positive().max(MAX_FILE_SIZE);
export type FileSize = z.infer<typeof FileSizeSchema>;

export const VisibilitySchema = z.enum(['public', 'private']);
export type Visibility = z.infer<typeof VisibilitySchema>;

export const FileUploadRequestHeaderSchema = z.object({
  'x-file-name': FileNameSchema,
  'x-file-type': MimeTypeSchema,
  'content-length': z
    .string()
    .regex(/^\d+$/, { message: 'Content-Lengthは数字である必要があります' })
    .transform(Number)
    .pipe(FileSizeSchema),
  'x-visibility': VisibilitySchema,
});
