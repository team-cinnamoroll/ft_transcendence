import { FileStoragesServiceRepositorySpec } from '../repositories/storage-service.repository';
import { FileMetadataRepositorySpec } from '../repositories/file-metadata.repository';
import { type FileMetadataId, type UserId } from '@tracen/contracts';
import { type FileMetadata } from '../file-metadata.entity';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class FileDownloadError extends Error {
  public readonly code: ContentfulStatusCode;
  constructor(message: string, code: ContentfulStatusCode) {
    super(message);
    this.name = 'FileDownloadError';
    this.code = code;
  }
}

export async function downloadPrivateFile(
  storageRepo: FileStoragesServiceRepositorySpec,
  fileMetadataRepo: FileMetadataRepositorySpec,
  fileId: FileMetadataId,
  clientId: UserId
): Promise<{ stream: ReadableStream<Uint8Array>; metadata: FileMetadata }> {
  // Fetch the file metadata to get the file path
  const fileMetadata = await fileMetadataRepo.findById(fileId);
  if (!fileMetadata) {
    throw new FileDownloadError(`File with ID ${fileId} not found.`, 404);
  }

  const { bucket, storageKey, ownerId } = fileMetadata;

  if (clientId !== ownerId) {
    throw new FileDownloadError('You do not have permission to download this file.', 403);
  }

  try {
    // Get the file from storage as a ReadableStream
    const stream = await storageRepo.get(bucket, storageKey);
    if (!stream) {
      throw new FileDownloadError('File not found in storage.', 404);
    }
    return { stream, metadata: fileMetadata };
  } catch (error) {
    console.error('Failed to download file from storage:', error);
    throw new FileDownloadError('Failed to download file from storage.', 500);
  }
}
