import type { MiddlewareHandler } from 'hono';

import { ProtectedEnv } from '../../shared/types/hono';
import { FileStoragesServiceRepositorySpec } from './domain/repositories/storage-service.repository';
import { FileMetadataRepositorySpec } from './domain/repositories/file-metadata.repository';
import { FileUrlGeneratorSpec } from './domain/file-url-generator';
import {
  getFileStorageServiceRepository,
  getFileMetadataRepository,
  getFileUrlGenerator,
} from './infra/file-storage.repository.di';
import { makeSafeResponse } from '../../shared/utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

export type FileStorageHandlerEnv = ProtectedEnv & {
  Variables: {
    fileStorageRepo: FileStoragesServiceRepositorySpec;
    fileMetadataRepo: FileMetadataRepositorySpec;
    fileUrlGenerator: FileUrlGeneratorSpec;
  };
};

export function injectFileStorageDeps(): MiddlewareHandler<FileStorageHandlerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Service Initialization error',
        }),
        500
      );
    }
    const fileStorageRepo = getFileStorageServiceRepository(config.FILE_STORAGE_BASE_DIR);
    const fileMetadataRepo = getFileMetadataRepository(config.DATABASE_URL);
    const fileUrlGenerator = getFileUrlGenerator();
    if (!fileStorageRepo || !fileMetadataRepo || !fileUrlGenerator) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'File storage dependencies are not initialized',
        }),
        500
      );
    }
    c.set('fileStorageRepo', fileStorageRepo);
    c.set('fileMetadataRepo', fileMetadataRepo);
    c.set('fileUrlGenerator', fileUrlGenerator);
    await next();
  };
}
