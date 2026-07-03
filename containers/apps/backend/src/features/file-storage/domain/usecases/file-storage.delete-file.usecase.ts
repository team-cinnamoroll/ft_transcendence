import { FileStoragesServiceRepositorySpec } from '../repositories/storage-service.repository';
import { FileMetadataRepositorySpec } from '../repositories/file-metadata.repository';
import { type FileDeleteResponse } from '@tracen/contracts';
import { type FileDeleteRequest } from './file-storage.file-delete.request';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class FileDeleteError extends Error {
  public readonly code: ContentfulStatusCode;
  constructor(message: string, code: ContentfulStatusCode) {
    super(message);
    this.name = 'FileDeleteError';
    this.code = code;
  }
}

export async function deleteFile(
  storageRepo: FileStoragesServiceRepositorySpec,
  fileMetadataRepo: FileMetadataRepositorySpec,
  deleteRequest: FileDeleteRequest
): Promise<FileDeleteResponse> {
  const { fileId, clientId } = deleteRequest;

  if (!fileId) {
    throw new FileDeleteError('File ID is required for deletion.', 400);
  }

  // Fetch the file metadata to get the file path
  const fileMetadata = await fileMetadataRepo.findById(fileId);
  if (!fileMetadata) {
    throw new FileDeleteError(`File with ID ${fileId} not found.`, 404);
  }

  const { bucket, storageKey, ownerId } = fileMetadata;

  if (clientId !== ownerId) {
    throw new FileDeleteError('You do not have permission to delete this file.', 403);
  }

  try {
    // Delete the file from storage
    await storageRepo.delete(bucket, storageKey);
  } catch (error) {
    console.error('Failed to delete file from storage:', error);
    throw new FileDeleteError('Failed to delete file from storage.', 500);
  }

  try {
    // Delete the metadata from the repository
    await fileMetadataRepo.deleteById(fileId);
  } catch (error) {
    console.error('Failed to delete file metadata:', error);
    throw new FileDeleteError('Failed to delete file metadata.', 500);
  }

  return { success: true };
}
