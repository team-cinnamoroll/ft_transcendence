import { inArray } from 'drizzle-orm';

import type { FileMetadataId, FileUrl } from '@tracen/contracts';
import type {
  FileQueryServiceSpec,
  FileUrlDto,
} from '../../../../core-domain/file/file.query-service';
import { FileUrlGeneratorSpec } from '../../domain/file-url-generator';

import type { TracenDb } from '../../../../shared/infra/db/client';
import { fileMetadata } from './schema';
import { mapFileMetadata } from './drizzle-mapper';

class DrizzleFileQueryServiceImpl implements FileQueryServiceSpec {
  constructor(
    private readonly db: TracenDb,
    private readonly fileUrlGenerator: FileUrlGeneratorSpec
  ) {}

  async getFileUrlsByFileIds(fileIds: FileMetadataId[]): Promise<Map<FileMetadataId, FileUrlDto>> {
    const resultMap = new Map<FileMetadataId, FileUrlDto>();

    if (fileIds.length === 0) {
      return resultMap;
    }

    const rows = await this.db.select().from(fileMetadata).where(inArray(fileMetadata.id, fileIds));

    const fileMetadataList = rows.map(mapFileMetadata);

    for (const fileMetadata of fileMetadataList) {
      const fileUrl: FileUrl = this.fileUrlGenerator.generateFileUrl(
        fileMetadata.bucket,
        fileMetadata.storageKey,
        fileMetadata.id
      );

      const fileUrlDto: FileUrlDto = {
        id: fileMetadata.id,
        url: fileUrl,
      };

      resultMap.set(fileMetadata.id, fileUrlDto);
    }

    return resultMap;
  }
}

export function createDrizzleFileQueryService(
  db: TracenDb,
  fileUrlGenerator: FileUrlGeneratorSpec
): FileQueryServiceSpec {
  return new DrizzleFileQueryServiceImpl(db, fileUrlGenerator);
}
