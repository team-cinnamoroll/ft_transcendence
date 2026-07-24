import { type File, type FileMetadataId } from '@tracen/contracts';

export interface FileQueryServiceSpec {
  getFileUrlsByFileIds(fileIds: FileMetadataId[]): Promise<Map<FileMetadataId, File>>;
}
