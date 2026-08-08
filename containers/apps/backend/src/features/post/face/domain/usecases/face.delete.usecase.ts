import { FaceRepositorySpec } from '../face.repository';
import type { UserId } from '@tracen/contracts';
import { NotFoundError, ForbiddenError } from '../../../../../shared/errors/global.error';

export async function deleteFace(
  repo: FaceRepositorySpec,
  requesterId: UserId,
  faceId: string
): Promise<void> {
  try {
    const existingFace = await repo.getFaceById(faceId);
    if (!existingFace) {
      throw new NotFoundError(`Face with ID ${faceId} not found`);
    }
    if (existingFace.userId !== requesterId) {
      throw new ForbiddenError(`Face with ID ${faceId} does not belong to the current user`);
    }

    await repo.deleteFaceById(faceId);
    return;
  } catch (error) {
    console.error('Error deleting face in repository:', error);
    throw error;
  }
}
