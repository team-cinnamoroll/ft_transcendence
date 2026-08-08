import { SeedRepositorySpec } from '../seed.repository';
import { FaceRepositorySpec } from '../../../face/domain/face.repository';
import { UserId } from '@tracen/contracts';
import { NotFoundError, ForbiddenError } from '../../../../../shared/errors/global.error';

export async function deleteSeed(
  repo: SeedRepositorySpec,
  faceRepo: FaceRepositorySpec,
  requesterId: UserId,
  seedId: string
): Promise<void> {
  try {
    const existingSeed = await repo.getSeedById(seedId);
    if (!existingSeed) {
      throw new NotFoundError(`Seed with ID ${seedId} not found`);
    }
    // 投稿の所有者チェック
    if (existingSeed.userId !== requesterId) {
      throw new ForbiddenError(`Seed with ID ${seedId} does not belong to the current user`);
    }

    // APIドキュメント要件: 投稿に紐づく faceId が自分のものかを検証する
    const face = await faceRepo.getFaceById(existingSeed.faceId);
    if (!face) {
      throw new NotFoundError(`Face with ID ${existingSeed.faceId} not found`);
    }
    if (face.userId !== requesterId) {
      throw new ForbiddenError(
        `Face with ID ${existingSeed.faceId} does not belong to the current user`
      );
    }

    await repo.deleteSeedById(seedId);
    return;
  } catch (error) {
    console.error('Error deleting seed in repository:', error);
    throw error;
  }
}
