import { FaceRepositorySpec } from '../face.repository';
import { FileQueryServiceSpec } from '../../../../../core-domain/file/file.query-service';
import type { UserId, UpdateFaceRequest, Face } from '@tracen/contracts';
import { FaceEntitySchema } from '../face.entity';
import { toFace } from './face.mapper';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';
import { NotFoundError, ForbiddenError } from '../../../../../shared/errors/global.error';

export async function updateFace(
  repo: FaceRepositorySpec,
  fileQueryService: FileQueryServiceSpec,
  requesterId: UserId,
  faceId: string,
  request: UpdateFaceRequest
): Promise<Face> {
  try {
    const existingFace = await repo.getFaceById(faceId);
    if (!existingFace) {
      throw new NotFoundError(`Face with ID ${faceId} not found`);
    }
    if (existingFace.userId !== requesterId) {
      throw new ForbiddenError(`Face with ID ${faceId} does not belong to the current user`);
    }

    const modifiedFace = makeSafeUsecaseResult(FaceEntitySchema, {
      id: existingFace.id,
      userId: existingFace.userId,
      name: request.name,
      emoji: request.emoji ?? null,
      description: request.description ?? null,
      imageId: request.imageId ?? null,
      visibility: existingFace.visibility,
    });

    const updatedFace = await repo.updateFace(modifiedFace);
    return toFace(updatedFace, fileQueryService);
  } catch (error) {
    console.error('Error updating face in repository:', error);
    throw error;
  }
}
