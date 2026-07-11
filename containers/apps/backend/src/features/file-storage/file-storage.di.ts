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
      return c.json({ message: 'Config is required' }, 500);
    }
    const fileStorageRepo = getFileStorageServiceRepository(config.FILE_STORAGE_BASE_DIR);
    const fileMetadataRepo = getFileMetadataRepository(config.DATABASE_URL);
    const fileUrlGenerator = getFileUrlGenerator();
    c.set('fileStorageRepo', fileStorageRepo);
    c.set('fileMetadataRepo', fileMetadataRepo);
    c.set('fileUrlGenerator', fileUrlGenerator);
    await next();
  };
}
