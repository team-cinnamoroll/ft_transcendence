import { type FileMetadataId, type FileUrl } from '@tracen/contracts';

export interface FileUrlDto {
  id: FileMetadataId;
  url: FileUrl;
}

export interface FileQueryServiceSpec {
  getFileUrlsByFileIds(fileIds: FileMetadataId[]): Promise<Map<FileMetadataId, FileUrlDto>>;
}
