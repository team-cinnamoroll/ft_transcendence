import { FileStoragesServiceRepositorySpec } from '../repositories/storage-service.repository';
import { FileMetadataRepositorySpec } from '../repositories/file-metadata.repository';
import { type FileDeleteOperationRequest } from './file-storage.file-delete.request';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../../../../shared/errors/global.error';

export async function deleteFile(
  storageRepo: FileStoragesServiceRepositorySpec,
  fileMetadataRepo: FileMetadataRepositorySpec,
  deleteRequest: FileDeleteOperationRequest
): Promise<void> {
  const { fileId, clientId } = deleteRequest;

  if (!fileId) {
    throw new ValidationError('File ID is required for deletion.');
  }

  // Fetch the file metadata to get the file path
  const fileMetadata = await fileMetadataRepo.findById(fileId);
  if (!fileMetadata) {
    throw new NotFoundError(`File with ID ${fileId} not found.`);
  }

  const { bucket, storageKey, ownerId } = fileMetadata;

  if (clientId !== ownerId) {
    throw new ForbiddenError('You do not have permission to delete this file.');
  }

  try {
    // Delete the file from storage
    await storageRepo.delete(bucket, storageKey);
  } catch (error) {
    console.error('Failed to delete file from storage:', error);
    throw error;
  }

  try {
    // Delete the metadata from the repository
    await fileMetadataRepo.deleteById(fileId);
  } catch (error) {
    console.error('Failed to delete file metadata:', error);
    throw error;
  }
}
