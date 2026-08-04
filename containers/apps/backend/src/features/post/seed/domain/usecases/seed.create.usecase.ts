import { v4 as uuidv4 } from 'uuid';

import { SeedRepositorySpec } from '../seed.repository';
import { FaceRepositorySpec } from '../../../face/domain/face.repository';
import { FileQueryServiceSpec } from '../../../../../core-domain/file/file.query-service';
import type { UserId, CreateSeedRequest, Seed } from '@tracen/contracts';
import { SeedEntitySchema } from '../seed.entity';
import { toSeed } from './seed.mapper';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';
import { NotFoundError, UnauthorizedError } from '../../../../../shared/errors/global.error';

export async function createSeed(
  repo: SeedRepositorySpec,
  faceRepo: FaceRepositorySpec,
  fileQueryService: FileQueryServiceSpec,
  requesterId: UserId,
  request: CreateSeedRequest
): Promise<Seed> {
  try {
    // APIドキュメント要件: 投稿先の faceId が自分のものかを検証する
    const face = await faceRepo.getFaceById(request.faceId);
    if (!face) {
      throw new NotFoundError(`Face with ID ${request.faceId} not found`);
    }
    if (face.userId !== requesterId) {
      throw new UnauthorizedError(
        `Face with ID ${request.faceId} does not belong to the current user`
      );
    }

    const seedId = uuidv4();
    const createdAt = new Date().toISOString();
    const newSeed = makeSafeUsecaseResult(SeedEntitySchema, {
      id: seedId,
      faceId: request.faceId,
      userId: requesterId,
      body: request.body,
      imageIds: request.imageIds,
      createdAt: createdAt,
      updatedAt: createdAt,
    });
    const storedSeed = await repo.createSeed(newSeed);
    return toSeed(storedSeed, fileQueryService);
  } catch (error) {
    console.error('Error creating seed in repository:', error);
    throw error;
  }
}
