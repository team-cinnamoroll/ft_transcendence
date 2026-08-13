import { SeedEntity } from '../seed.entity';
import { FileQueryServiceSpec } from '../../../../../core-domain/file/file.query-service';
import { Seed } from '@tracen/contracts';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';
import { SeedSchema } from '@tracen/contracts';
import { InternalValidationError } from '../../../../../shared/errors/global.error';

export async function toSeed(
  seedEntity: SeedEntity,
  fileQueryService: FileQueryServiceSpec
): Promise<Seed> {
  if (seedEntity.imageIds.length > 0) {
    const imageFileMap = await fileQueryService.getFileUrlsByFileIds(seedEntity.imageIds);
    const imageFiles = seedEntity.imageIds.map((imageId) => {
      const fileDto = imageFileMap.get(imageId);
      if (!fileDto) {
        throw new InternalValidationError(
          `Image file with ID ${imageId} not found for seed ${seedEntity.id}`
        );
      }
      return {
        id: fileDto.id,
        url: fileDto.url,
        fileName: fileDto.fileName,
        mimeType: fileDto.mimeType,
      };
    });

    return makeSafeUsecaseResult(SeedSchema, {
      id: seedEntity.id,
      faceId: seedEntity.faceId,
      userId: seedEntity.userId,
      body: seedEntity.body,
      images: imageFiles,
      createdAt: seedEntity.createdAt,
      updatedAt: seedEntity.updatedAt,
    });
  }
  return makeSafeUsecaseResult(SeedSchema, {
    id: seedEntity.id,
    faceId: seedEntity.faceId,
    userId: seedEntity.userId,
    body: seedEntity.body,
    images: [],
    createdAt: seedEntity.createdAt,
    updatedAt: seedEntity.updatedAt,
  });
}

export async function toSeeds(
  seedEntities: SeedEntity[],
  fileQueryService: FileQueryServiceSpec
): Promise<Seed[]> {
  if (seedEntities.length === 0) return [];

  const imageFileIds = seedEntities.flatMap((entity) => entity.imageIds);

  const imageFileMap = await fileQueryService.getFileUrlsByFileIds(imageFileIds);

  return seedEntities.map((entity) => {
    if (entity.imageIds.length > 0) {
      const imageFiles = entity.imageIds.map((imageId) => {
        const fileDto = imageFileMap.get(imageId);
        if (!fileDto) {
          throw new InternalValidationError(
            `Image file with ID ${imageId} not found for seed ${entity.id}`
          );
        }
        return {
          id: fileDto.id,
          url: fileDto.url,
          fileName: fileDto.fileName,
          mimeType: fileDto.mimeType,
        };
      });

      return makeSafeUsecaseResult(SeedSchema, {
        id: entity.id,
        faceId: entity.faceId,
        userId: entity.userId,
        body: entity.body,
        images: imageFiles,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      });
    }
    return makeSafeUsecaseResult(SeedSchema, {
      id: entity.id,
      faceId: entity.faceId,
      userId: entity.userId,
      body: entity.body,
      images: [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  });
}
