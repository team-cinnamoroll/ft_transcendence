import { eq, inArray } from 'drizzle-orm';

import { type FileMetadataId } from '@tracen/contracts';
import type { FileMetadata } from '../../domain/file-metadata.entity';
import type { FileMetadataRepositorySpec } from '../../domain/repositories/file-metadata.repository';

import type { TracenDb } from '../../../../shared/infra/db/client';
import { fileMetadata, type NewFileMetadataRow } from './schema';
import { mapFileMetadata } from './drizzle-mapper';

class FileMetadataDBRepositoryImpl implements FileMetadataRepositorySpec {
  constructor(private readonly db: TracenDb) {}

  async findById(id: FileMetadataId): Promise<FileMetadata | null> {
    const rows = await this.db.select().from(fileMetadata).where(eq(fileMetadata.id, id)).limit(1);

    if (rows.length === 0) return null;
    return mapFileMetadata(rows[0]);
  }

  async findByIds(ids: FileMetadataId[]): Promise<FileMetadata[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db.select().from(fileMetadata).where(inArray(fileMetadata.id, ids));

    return rows.map(mapFileMetadata);
  }

  async create(metadata: FileMetadata): Promise<void> {
    const newRow: NewFileMetadataRow = {
      id: metadata.id,
      ownerId: metadata.ownerId,
      bucket: metadata.bucket,
      storageKey: metadata.storageKey,
      fileName: metadata.fileName,
      mimeType: metadata.mimeType,
      fileSize: metadata.fileSize,
    };

    await this.db.insert(fileMetadata).values(newRow);
  }

  async deleteById(id: FileMetadataId): Promise<boolean> {
    const rows = await this.db
      .delete(fileMetadata)
      .where(eq(fileMetadata.id, id))
      .returning({ id: fileMetadata.id });

    return rows.length > 0;
  }
}

export function createDrizzleFileMetadataRepository(db: TracenDb): FileMetadataRepositorySpec {
  return new FileMetadataDBRepositoryImpl(db);
}
