import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { injectFileStorageDeps, FileStorageHandlerEnv } from './file-storage.di';
import { saveFile } from './domain/file-storage.usecase';
import { FileUploadRequestHeaderSchema, FileUploadResponseSchema } from '@tracen/contracts';
import { FileSaveRequestSchema } from './domain/file-storage.file-save.request';

export function fileStorageRouter() {
  return new Hono<FileStorageHandlerEnv>()
    .use('*', injectFileStorageDeps())
    .post('/upload', zValidator('header', FileUploadRequestHeaderSchema), async (c) => {
      const fileStorageRepo = c.get('fileStorageRepo');
      const fileMetadataRepo = c.get('fileMetadataRepo');
      if (!fileStorageRepo || !fileMetadataRepo) {
        return c.json(
          FileUploadResponseSchema.parse({
            success: false,
            message: 'File storage dependencies are not initialized',
          }),
          500
        );
      }

      const jwtPayload = c.get('jwtPayload');
      const ownerId = jwtPayload.sub;
      if (!ownerId) {
        return c.json(
          FileUploadResponseSchema.parse({
            success: false,
            message: 'JWT token is invalid: sub (userId) is missing',
          }),
          400
        );
      }
      const headers = c.req.valid('header');

      try {
        const fileSaveRequest = FileSaveRequestSchema.parse({
          ownerId,
          fileName: headers['x-file-name'],
          mimeType: headers['x-file-type'],
          fileSize: Number(headers['content-length']),
          visibility: headers['x-visibility'],
          inputData: c.req.raw.body,
        });
        const { fileId, filePath } = await saveFile(
          fileStorageRepo,
          fileMetadataRepo,
          fileSaveRequest
        );

        return c.json(
          FileUploadResponseSchema.parse({
            success: true,
            fileId,
            filePath,
          }),
          200
        );
      } catch (error) {
        console.error('File upload failed:', error);
        return c.json(
          FileUploadResponseSchema.parse({
            success: false,
            message: 'File upload failed',
          }),
          500
        );
      }
    });
}
