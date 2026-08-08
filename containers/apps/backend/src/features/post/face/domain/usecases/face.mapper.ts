import { FaceEntity } from '../face.entity';
import { FileQueryServiceSpec } from '../../../../../core-domain/file/file.query-service';
import { Face } from '@tracen/contracts';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';
import { FaceSchema } from '@tracen/contracts';
import { InternalValidationError } from '../../../../../shared/errors/global.error';

export async function toFace(
  faceEntity: FaceEntity,
  fileQueryService: FileQueryServiceSpec
): Promise<Face> {
  if (faceEntity.imageId) {
    const imageFileMap = await fileQueryService.getFileUrlsByFileIds([faceEntity.imageId]);
    const fileDto = imageFileMap.get(faceEntity.imageId) || null;
    if (!fileDto) {
      throw new InternalValidationError(
        `Image file with ID ${faceEntity.imageId} not found for face ${faceEntity.id}`
      );
    }
    return makeSafeUsecaseResult(FaceSchema, {
      id: faceEntity.id,
      userId: faceEntity.userId,
      name: faceEntity.name,
      emoji: faceEntity.emoji,
      description: faceEntity.description,
      image: {
        id: fileDto.id,
        url: fileDto.url,
      },
      visibility: faceEntity.visibility,
    });
  }

  return makeSafeUsecaseResult(FaceSchema, {
    id: faceEntity.id,
    userId: faceEntity.userId,
    name: faceEntity.name,
    emoji: faceEntity.emoji,
    description: faceEntity.description,
    image: null,
    visibility: faceEntity.visibility,
  });
}

export async function toFaces(
  faceEntities: FaceEntity[],
  fileQueryService: FileQueryServiceSpec
): Promise<Face[]> {
  const imageFileIds = faceEntities
    .filter((entity) => entity.imageId !== null)
    .map((entity) => entity.imageId as string);

  const imageFileMap = await fileQueryService.getFileUrlsByFileIds(imageFileIds);

  return faceEntities.map((entity) => {
    if (entity.imageId) {
      const fileDto = imageFileMap.get(entity.imageId);
      if (!fileDto) {
        throw new InternalValidationError(
          `Image file with ID ${entity.imageId} not found for face ${entity.id}`
        );
      }
      return makeSafeUsecaseResult(FaceSchema, {
        id: entity.id,
        userId: entity.userId,
        name: entity.name,
        emoji: entity.emoji,
        description: entity.description,
        image: {
          id: fileDto.id,
          url: fileDto.url,
        },
        visibility: entity.visibility,
      });
    }

    return makeSafeUsecaseResult(FaceSchema, {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      emoji: entity.emoji,
      description: entity.description,
      image: null,
      visibility: entity.visibility,
    });
  });
}
