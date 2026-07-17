import { v4 as uuidv4 } from 'uuid';

import {
  FileStoragesServiceRepositorySpec,
  UploadOptionsSchema,
} from '../repositories/storage-service.repository';
import { FileMetadataRepositorySpec } from '../repositories/file-metadata.repository';
import { FileUrlGeneratorSpec } from '../file-url-generator';
import type { FileMetadataId, FilePath } from '@tracen/contracts';
import { FileMetadataSchema } from '../file-metadata.entity';
import { type FileSaveRequest } from './file-storage.file-save.request';

export async function saveFile(
  storageRepo: FileStoragesServiceRepositorySpec,
  fileMetadataRepo: FileMetadataRepositorySpec,
  fileUrlGenerator: FileUrlGeneratorSpec,
  saveRequest: FileSaveRequest
): Promise<{ fileId: FileMetadataId; filePath: FilePath }> {
  const fileMetadataId: FileMetadataId = uuidv4();
  const storageKey = fileUrlGenerator.getStorageKey(fileMetadataId, saveRequest.mimeType);
  const bucket = fileUrlGenerator.getBucketName(saveRequest.visibility);

  const uploadOptions = UploadOptionsSchema.parse({
    bucket,
    storageKey,
    mimeType: saveRequest.mimeType,
    contentLength: saveRequest.fileSize,
  });
  try {
    await storageRepo.save(uploadOptions, saveRequest.inputData);
  } catch (error) {
    console.error('ファイルの永続化に失敗しました（ストレージ保存エラー）', error);
    // 上位のユースケースにエラーを再スローする
    throw error;
  }
  const filePath: FilePath = fileUrlGenerator.generateFileUrl(bucket, storageKey, fileMetadataId);

  const fileMetadata = FileMetadataSchema.parse({
    id: fileMetadataId,
    ownerId: saveRequest.ownerId,
    bucket,
    storageKey,
    fileName: saveRequest.fileName,
    mimeType: saveRequest.mimeType,
    fileSize: saveRequest.fileSize,
  });
  try {
    // 2. 次にPostgreSQL（DB）にメタデータを保存
    await fileMetadataRepo.create(fileMetadata);
  } catch (error) {
    // 3. 【ロールバック処理】DB保存に失敗した場合、保存してしまった物理ファイルを即座に削除する
    // これにより、ゴミファイルがディスクに残るのを完全に防ぐ
    await storageRepo.delete(bucket, storageKey);
    console.error('ファイルの永続化に失敗しました（メタデータ登録エラー）', error);
    // 上位のユースケースにエラーを再スローする
    throw error;
  }

  return { fileId: fileMetadataId, filePath };
}
