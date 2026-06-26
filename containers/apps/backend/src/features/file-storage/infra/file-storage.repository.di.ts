import type { FileStoragesServiceRepositorySpec } from '../domain/repositories/storage-service.repository';
import type { FileMetadataRepositorySpec } from '../domain/repositories/file-metadata.repository';

import { getDb } from '../../../shared/infra/db/client';
import { createDrizzleFileMetadataRepository } from './db/drizzle-file-metadata.repository.impl';
import { createLocalStorageRepository } from './local-storage/local-file-storage.repository.impl';

export function getFileStorageServiceRepository(
  baseDir: string
): FileStoragesServiceRepositorySpec {
  return createLocalStorageRepository(baseDir);
}

export function getFileMetadataRepository(databaseUrl: string): FileMetadataRepositorySpec {
  return createDrizzleFileMetadataRepository(getDb(databaseUrl));
}
