import { eq, inArray } from 'drizzle-orm';

import { type FileMetadataId } from '@tracen/contracts';
import type { FileMetadata } from '../../domain/file-metadata.entity';
import type { FileMetadataRepositorySpec } from '../../domain/repositories/file-metadata.repository';

import type { TracenDb } from '../../../../shared/infra/db/client';
import { fileMetadata, type NewFileMetadataRow } from './schema';
import { mapFileMetadata } from './drizzle-mapper';
import { ValidationError } from '../../../../shared/errors/global.error';

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
    try {
      await this.db.insert(fileMetadata).values(newRow);
    } catch (error: unknown) {
      // drizzle-ormのエラーは、通常、Errorオブジェクトのcauseプロパティにデータベースエラーが格納される
      // causeに格納されるpostgresqlのエラーコードを確認して、ユニーク制約違反や外部キー制約違反などのケースをハンドリングする
      const dbError = error instanceof Error ? error.cause : undefined;
      if (dbError && typeof dbError === 'object' && 'code' in dbError) {
        const errObj = dbError as Record<string, unknown>;
        // ユニーク制約違反
        if (errObj.code === '23505') {
          if (errObj.constraint_name === 'file_metadata_storage_key_unique') {
            throw new ValidationError(`Storage key "${metadata.storageKey}" is already in use.`);
          }
          if (errObj.constraint_name === 'file_metadata_pkey') {
            throw new ValidationError(`File metadata with ID "${metadata.id}" already exists.`);
          }
        }
        // データ長超過 (22001)
        if (errObj.code === '22001') {
          throw new ValidationError('Input data exceeds the maximum allowed length for a column.');
        }

        // 不正なUUID等のデータ型エラー (22P02)
        if (errObj.code === '22P02') {
          throw new ValidationError('Invalid data format provided (e.g., malformed UUID).');
        }
      }
      throw error; // 上記で処理されなかったエラーは再スロー
    }
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
