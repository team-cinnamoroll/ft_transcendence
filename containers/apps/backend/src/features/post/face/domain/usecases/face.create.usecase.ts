import { v4 as uuidv4 } from 'uuid';

import { FaceRepositorySpec } from '../face.repository';
import { FileQueryServiceSpec } from '../../../../../core-domain/file/file.query-service';
import type { UserId, CreateFaceRequest, Face } from '@tracen/contracts';
import { FaceEntitySchema } from '../face.entity';
import { toFace } from './face.mapper';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';

export async function createFace(
  repo: FaceRepositorySpec,
  fileQueryService: FileQueryServiceSpec,
  requesterId: UserId,
  request: CreateFaceRequest
): Promise<Face> {
  try {
    const faceId = uuidv4();
    const newFace = makeSafeUsecaseResult(FaceEntitySchema, {
      id: faceId,
      userId: requesterId,
      name: request.name,
      emoji: request.emoji ?? null,
      description: request.description ?? null,
      imageId: request.imageId ?? null,
      visibility: request.visibility,
    });
    // repo.createFaceが失敗する理由は、内部的なエラーしか考えられない
    const storedFace = await repo.createFace(newFace);
    return toFace(storedFace, fileQueryService);
  } catch (error) {
    console.error('Error creating face in repository:', error);
    throw error;
  }
}
