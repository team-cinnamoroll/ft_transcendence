import { type FileMetadataId } from '@tracen/contracts';
import { FileMetadata } from '../file-metadata.entity';

export interface FileMetadataRepositorySpec {
  findById(id: FileMetadataId): Promise<FileMetadata | null>;
  findByIds(ids: FileMetadataId[]): Promise<FileMetadata[]>;
  create(metadata: FileMetadata): Promise<void>;
  deleteById(id: FileMetadataId): Promise<boolean>;
}
