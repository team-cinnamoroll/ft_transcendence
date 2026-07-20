import { FileStoragesServiceRepositorySpec } from '../repositories/storage-service.repository';
import { FileMetadataRepositorySpec } from '../repositories/file-metadata.repository';
import { type FileMetadataId, type UserId } from '@tracen/contracts';
import { type FileMetadata } from '../file-metadata.entity';
import { NotFoundError, ForbiddenError } from '../../../../shared/errors/global.error';

export async function downloadPrivateFile(
  storageRepo: FileStoragesServiceRepositorySpec,
  fileMetadataRepo: FileMetadataRepositorySpec,
  fileId: FileMetadataId,
  clientId: UserId
): Promise<{ stream: ReadableStream<Uint8Array>; metadata: FileMetadata }> {
  // Fetch the file metadata to get the file path
  const fileMetadata = await fileMetadataRepo.findById(fileId);
  if (!fileMetadata) {
    throw new NotFoundError(`File with ID ${fileId} not found.`);
  }

  const { bucket, storageKey, ownerId } = fileMetadata;

  if (clientId !== ownerId) {
    throw new ForbiddenError('You do not have permission to download this file.');
  }

  try {
    // Get the file from storage as a ReadableStream
    const stream = await storageRepo.get(bucket, storageKey);
    if (!stream) {
      throw new NotFoundError('File not found in storage.');
    }
    return { stream, metadata: fileMetadata };
  } catch (error) {
    console.error('Failed to download file from storage:', error);
    throw error;
  }
}
