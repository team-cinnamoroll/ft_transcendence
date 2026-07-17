import type { FileStoragesServiceRepositorySpec } from '../domain/repositories/storage-service.repository';
import type { FileMetadataRepositorySpec } from '../domain/repositories/file-metadata.repository';
import type { FileUrlGeneratorSpec } from '../domain/file-url-generator';

import { getDb } from '../../../shared/infra/db/client';
import { createDrizzleFileMetadataRepository } from './db/drizzle-file-metadata.repository.impl';
import { createLocalStorageRepository } from './local-storage/local-file-storage.repository.impl';
import { createFileUrlGenerator } from './file-url-generator.impl';

export function getFileStorageServiceRepository(
  baseDir: string
): FileStoragesServiceRepositorySpec {
  return createLocalStorageRepository(baseDir);
}

export function getFileMetadataRepository(databaseUrl: string): FileMetadataRepositorySpec {
  return createDrizzleFileMetadataRepository(getDb(databaseUrl));
}

export function getFileUrlGenerator(): FileUrlGeneratorSpec {
  return createFileUrlGenerator();
}
