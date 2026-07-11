import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { injectFileStorageDeps, FileStorageHandlerEnv } from './file-storage.di';
import { saveFile } from './domain/usecases/file-storage.save-file.usecase';
import { deleteFile, FileDeleteError } from './domain/usecases/file-storage.delete-file.usecase';
import {
  downloadPrivateFile,
  FileDownloadError,
} from './domain/usecases/file-storage.download-private-file.usecase';
import {
  FileUploadRequestHeaderSchema,
  FileUploadResponseSchema,
  FileDeleteRequestSchema as FileDeleteApiRequestSchema,
  FileDeleteResponseSchema,
  FileMetadataIdSchema,
  SuccessResponseSchema,
} from '@tracen/contracts';
import { FileSaveRequestSchema } from './domain/usecases/file-storage.file-save.request';
import { FileDeleteRequestSchema } from './domain/usecases/file-storage.file-delete.request';

export function fileStorageRouter() {
  return new Hono<FileStorageHandlerEnv>()
    .use('*', injectFileStorageDeps())
    .post('/upload', zValidator('header', FileUploadRequestHeaderSchema), async (c) => {
      const fileStorageRepo = c.get('fileStorageRepo');
      const fileMetadataRepo = c.get('fileMetadataRepo');
      const fileUrlGenerator = c.get('fileUrlGenerator');
      if (!fileStorageRepo || !fileMetadataRepo || !fileUrlGenerator) {
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
          fileUrlGenerator,
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
    })
    .post('/delete', zValidator('json', FileDeleteApiRequestSchema), async (c) => {
      const fileStorageRepo = c.get('fileStorageRepo');
      const fileMetadataRepo = c.get('fileMetadataRepo');
      if (!fileStorageRepo || !fileMetadataRepo) {
        return c.json(
          FileDeleteResponseSchema.parse({
            success: false,
            message: 'File storage dependencies are not initialized',
          }),
          500
        );
      }

      const jwtPayload = c.get('jwtPayload');
      const clientId = jwtPayload.sub;
      if (!clientId) {
        return c.json(
          FileDeleteResponseSchema.parse({
            success: false,
            message: 'JWT token is invalid: sub (userId) is missing',
          }),
          400
        );
      }

      const deleteRequestBody = c.req.valid('json');

      try {
        const deleteRequest = FileDeleteRequestSchema.parse({
          fileId: deleteRequestBody.fileId,
          clientId,
        });
        const result = await deleteFile(fileStorageRepo, fileMetadataRepo, deleteRequest);
        return c.json(result, 200);
      } catch (error) {
        console.error('File deletion failed:', error);
        if (error instanceof FileDeleteError) {
          return c.json(
            FileDeleteResponseSchema.parse({
              success: false,
              message: error.message,
            }),
            error.code
          );
        }
        return c.json(
          FileDeleteResponseSchema.parse({
            success: false,
            message: 'File deletion failed',
          }),
          500
        );
      }
    })
    .get(
      '/download/:fileId',
      zValidator(
        'param',
        z.object({
          fileId: FileMetadataIdSchema,
        })
      ),
      async (c) => {
        const fileStorageRepo = c.get('fileStorageRepo');
        const fileMetadataRepo = c.get('fileMetadataRepo');
        if (!fileStorageRepo || !fileMetadataRepo) {
          return c.json(
            SuccessResponseSchema.parse({
              success: false,
              message: 'File storage dependencies are not initialized',
            }),
            500
          );
        }

        const jwtPayload = c.get('jwtPayload');
        const clientId = jwtPayload.sub;
        if (!clientId) {
          return c.json(
            SuccessResponseSchema.parse({
              success: false,
              message: 'JWT token is invalid: sub (userId) is missing',
            }),
            400
          );
        }

        const { fileId } = c.req.valid('param');

        try {
          const { stream, metadata } = await downloadPrivateFile(
            fileStorageRepo,
            fileMetadataRepo,
            fileId,
            clientId
          );
          c.header('Content-Type', metadata.mimeType);
          c.header('Content-Length', metadata.fileSize.toString());
          // 日本語ファイル名の文字化けを防ぐための RFC 5987 準拠のエンコーディング
          const encodedFileName = encodeURIComponent(metadata.fileName);
          c.header('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
          return c.body(stream);
        } catch (error) {
          console.error('File download failed:', error);
          if (error instanceof FileDownloadError) {
            return c.json(
              SuccessResponseSchema.parse({
                success: false,
                message: error.message,
              }),
              error.code
            );
          }
          return c.json(
            SuccessResponseSchema.parse({
              success: false,
              message: 'File download failed',
            }),
            500
          );
        }
      }
    );
}
