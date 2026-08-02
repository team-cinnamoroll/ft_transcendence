import { FaceRepositorySpec } from '../face.repository';
import type { UserId, UpdateFaceRequest } from '@tracen/contracts';
import { FaceEntitySchema } from '../face.entity';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';
import { NotFoundError, UnauthorizedError } from '../../../../../shared/errors/global.error';

export async function updateFace(
  repo: FaceRepositorySpec,
  requesterId: UserId,
  faceId: string,
  request: UpdateFaceRequest
): Promise<void> {
  try {
    const existingFace = await repo.getFaceById(faceId);
    if (!existingFace) {
      throw new NotFoundError(`Face with ID ${faceId} not found`);
    }
    if (existingFace.userId !== requesterId) {
      throw new UnauthorizedError('Unauthorized to update this face');
    }

    const modifiedFace = makeSafeUsecaseResult(FaceEntitySchema, {
      id: existingFace.id,
      userId: existingFace.userId,
      name: request.name,
      emoji: request.emoji ?? null,
      description: request.description ?? null,
      imageId: request.imageId ?? null,
      visibility: request.visibility,
    });

    await repo.updateFace(modifiedFace);
    return;
  } catch (error) {
    console.error('Error updating face in repository:', error);
    throw error;
  }
}
