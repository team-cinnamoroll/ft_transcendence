import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { injectFileStorageDeps, FileStorageHandlerEnv } from './file-storage.di';
import { saveFile } from './domain/usecases/file-storage.save-file.usecase';
import { deleteFile } from './domain/usecases/file-storage.delete-file.usecase';
import {
  downloadPrivateFile,
  FileDownloadError,
} from './domain/usecases/file-storage.download-private-file.usecase';
import {
  FileUploadRequestHeaderSchema,
  FileUploadResponseSchema,
  FileDeleteRequestSchema,
  FileDeleteResponseSchema,
  FileMetadataIdSchema,
  SuccessResponseSchema,
} from '@tracen/contracts';
import { FileSaveRequestSchema } from './domain/usecases/file-storage.file-save.request';
import { FileDeleteOperationRequestSchema } from './domain/usecases/file-storage.file-delete.request';
import { ValidationError, NotFoundError, ForbiddenError } from '../../shared/errors/global.error';
import { ZodError } from 'zod';

export function fileStorageRouter() {
  return new Hono<FileStorageHandlerEnv>()
    .use('*', injectFileStorageDeps())
    .post('/upload', zValidator('header', FileUploadRequestHeaderSchema), async (c) => {
      const fileStorageRepo = c.get('fileStorageRepo');
      const fileMetadataRepo = c.get('fileMetadataRepo');
      const fileUrlGenerator = c.get('fileUrlGenerator');

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
        throw error; // 未知のエラーは再スローしてグローバルエラーハンドラに任せる
      }
    })
    .post('/delete', zValidator('json', FileDeleteRequestSchema), async (c) => {
      const fileStorageRepo = c.get('fileStorageRepo');
      const fileMetadataRepo = c.get('fileMetadataRepo');
      try {
        const jwtPayload = c.get('jwtPayload');
        const clientId = jwtPayload.sub;
        if (!clientId) {
          throw new ValidationError('JWT token is invalid: sub (userId) is missing');
        }
        const deleteRequestBody = c.req.valid('json');
        const deleteRequest = FileDeleteOperationRequestSchema.parse({
          fileId: deleteRequestBody.fileId,
          clientId,
        });
        await deleteFile(fileStorageRepo, fileMetadataRepo, deleteRequest);
        return c.json(
          FileDeleteResponseSchema.parse({
            success: true,
          }),
          200
        );
      } catch (error) {
        console.error('File deletion failed:', error);
        if (error instanceof ZodError) {
          return c.json(
            FileDeleteResponseSchema.parse({
              success: false,
              message: 'Invalid request data',
            }),
            400
          );
        }
        if (error instanceof ValidationError) {
          return c.json(
            FileDeleteResponseSchema.parse({
              success: false,
              message: error.message,
            }),
            400
          );
        }
        if (error instanceof ForbiddenError) {
          return c.json(
            FileDeleteResponseSchema.parse({
              success: false,
              message: error.message,
            }),
            403
          );
        }
        if (error instanceof NotFoundError) {
          return c.json(
            FileDeleteResponseSchema.parse({
              success: false,
              message: error.message,
            }),
            404
          );
        }
        throw error; // 未知のエラーは再スローしてグローバルエラーハンドラに任せる
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
          throw error; // 未知のエラーは再スローしてグローバルエラーハンドラに任せる
        }
      }
    );
}
