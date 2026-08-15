import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../shared/utils/custom-z-validator';

import { injectFileStorageDeps, FileStorageHandlerEnv } from './file-storage.di';
import { saveFile } from './domain/usecases/file-storage.save-file.usecase';
import { deleteFile } from './domain/usecases/file-storage.delete-file.usecase';
import { downloadPrivateFile } from './domain/usecases/file-storage.download-private-file.usecase';
import {
  FileUploadRequestHeaderSchema,
  FileUploadResponseSchema,
  FileRequestSchema,
  FileDeleteResponseSchema,
  SimpleApiResponseSchema,
} from '@tracen/contracts';
import { FileSaveRequestSchema } from './domain/usecases/file-storage.file-save.request';
import { FileDeleteOperationRequestSchema } from './domain/usecases/file-storage.file-delete.request';
import { ValidationError, NotFoundError, ForbiddenError } from '../../shared/errors/global.error';
import { StorageQuotaExceededError, InternalStorageError } from './domain/file-storage.error';
import { ZodError } from 'zod';
import { makeSafeResponse } from '../../shared/utils/validation';
import { createFileSignatureValidatorStream } from '../../shared/utils/file-validator';

export function fileStorageRouter() {
  return new Hono<FileStorageHandlerEnv>()
    .use('*', injectFileStorageDeps())
    .post('/upload', cZValidator('header', FileUploadRequestHeaderSchema), async (c) => {
      const fileStorageRepo = c.get('fileStorageRepo');
      const fileMetadataRepo = c.get('fileMetadataRepo');
      const fileUrlGenerator = c.get('fileUrlGenerator');
      try {
        const jwtPayload = c.get('jwtPayload');
        const ownerId = jwtPayload.sub;
        const headers = c.req.valid('header');

        if (!c.req.raw.body) {
          throw new ValidationError('Request body is empty');
        }
        const validatedInputData = c.req.raw.body.pipeThrough(
          createFileSignatureValidatorStream(headers['x-file-type'])
        );

        const fileSaveRequest = FileSaveRequestSchema.parse({
          ownerId,
          fileName: headers['x-file-name'],
          mimeType: headers['x-file-type'],
          fileSize: Number(headers['content-length']),
          visibility: headers['x-visibility'],
          inputData: validatedInputData,
        });
        const { fileId, filePath } = await saveFile(
          fileStorageRepo,
          fileMetadataRepo,
          fileUrlGenerator,
          fileSaveRequest
        );
        return c.json(
          makeSafeResponse(FileUploadResponseSchema, {
            success: true,
            data: {
              fileId,
              filePath,
            },
          }),
          200
        );
      } catch (err) {
        console.error('Error during File upload:', err);
        if (err instanceof ZodError) {
          throw new ValidationError('Invalid request data');
        }
        if (err instanceof StorageQuotaExceededError) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: 'Storage is full. Cannot save the file.',
            }),
            507 // Insufficient Storage
          );
        }

        if (err instanceof InternalStorageError) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, {
              success: false,
              message: 'Permission denied writing to local storage.',
            }),
            500 // Internal Server Error
          );
        }
        throw err; // 未知のエラーは再スローしてグローバルエラーハンドラに任せる
      }
    })
    .get('/download/:fileId', cZValidator('param', FileRequestSchema), async (c) => {
      const fileStorageRepo = c.get('fileStorageRepo');
      const fileMetadataRepo = c.get('fileMetadataRepo');
      try {
        const jwtPayload = c.get('jwtPayload');
        const clientId = jwtPayload.sub;
        const { fileId } = c.req.valid('param');
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
        c.status(200);
        return c.body(stream);
      } catch (err) {
        console.error('Error during File download:', err);
        if (err instanceof ZodError) {
          throw new ValidationError('Invalid request data');
        }
        if (err instanceof ForbiddenError) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, { success: false, message: err.message }),
            403
          );
        }
        if (err instanceof NotFoundError) {
          return c.json(
            makeSafeResponse(SimpleApiResponseSchema, { success: false, message: err.message }),
            404
          );
        }
        throw err; // 未知のエラーは再スローしてグローバルエラーハンドラに任せる
      }
    })
    .delete('/delete/:fileId', cZValidator('param', FileRequestSchema), async (c) => {
      const fileStorageRepo = c.get('fileStorageRepo');
      const fileMetadataRepo = c.get('fileMetadataRepo');
      try {
        const jwtPayload = c.get('jwtPayload');
        const clientId = jwtPayload.sub;
        if (!clientId) {
          throw new ValidationError('JWT token is invalid: sub (userId) is missing');
        }
        const { fileId } = c.req.valid('param');
        const deleteRequest = FileDeleteOperationRequestSchema.parse({
          fileId,
          clientId,
        });
        await deleteFile(fileStorageRepo, fileMetadataRepo, deleteRequest);
        return c.body(null, 204);
      } catch (err) {
        console.error('Error during File deletion:', err);
        if (err instanceof ZodError) {
          throw new ValidationError('Invalid request data');
        }
        if (err instanceof ForbiddenError) {
          return c.json(
            makeSafeResponse(FileDeleteResponseSchema, { success: false, message: err.message }),
            403
          );
        }
        if (err instanceof NotFoundError) {
          return c.json(
            makeSafeResponse(FileDeleteResponseSchema, { success: false, message: err.message }),
            404
          );
        }
        throw err; // 未知のエラーは再スローしてグローバルエラーハンドラに任せる
      }
    });
}
