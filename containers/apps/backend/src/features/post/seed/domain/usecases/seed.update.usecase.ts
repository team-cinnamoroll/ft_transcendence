import { SeedRepositorySpec } from '../seed.repository';
import { FaceRepositorySpec } from '../../../face/domain/face.repository';
import type { UserId, UpdateSeedRequest } from '@tracen/contracts';
import { SeedEntitySchema } from '../seed.entity';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';
import { NotFoundError, UnauthorizedError } from '../../../../../shared/errors/global.error';

export async function updateSeed(
  repo: SeedRepositorySpec,
  faceRepo: FaceRepositorySpec,
  requesterId: UserId,
  seedId: string,
  request: UpdateSeedRequest
): Promise<void> {
  try {
    const existingSeed = await repo.getSeedById(seedId);
    if (!existingSeed) {
      throw new NotFoundError(`Seed with ID ${seedId} not found`);
    }
    // 投稿の所有者チェック
    if (existingSeed.userId !== requesterId) {
      throw new UnauthorizedError('Unauthorized to update this seed');
    }

    // APIドキュメント要件: 投稿に紐づく faceId が自分のものかを検証する
    const face = await faceRepo.getFaceById(existingSeed.faceId);
    if (!face) {
      throw new NotFoundError(`Face with ID ${existingSeed.faceId} not found`);
    }
    if (face.userId !== requesterId) {
      throw new UnauthorizedError(
        `Face with ID ${existingSeed.faceId} does not belong to the current user`
      );
    }

    const modifiedSeed = makeSafeUsecaseResult(SeedEntitySchema, {
      id: existingSeed.id,
      faceId: existingSeed.faceId,
      userId: existingSeed.userId,
      body: request.body,
      imageIds: request.imageIds,
      createdAt: existingSeed.createdAt,
      updatedAt: new Date().toISOString(),
    });

    await repo.updateSeed(modifiedSeed);
    return;
  } catch (error) {
    console.error('Error updating seed in repository:', error);
    throw error;
  }
}
