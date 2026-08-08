import { FaceQueryServiceSpec } from '../face.query-service';
import { FileQueryServiceSpec } from '../../../../../core-domain/file/file.query-service';
import type { FaceSummary, FaceId } from '@tracen/contracts';
import { FaceSummarySchema } from '@tracen/contracts';
import { toFace } from './face.mapper';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';
import { NotFoundError } from '../../../../../shared/errors/global.error';

export async function fetchSingleSummaryFace(
  queryService: FaceQueryServiceSpec,
  fileQueryService: FileQueryServiceSpec,
  faceId: FaceId
): Promise<FaceSummary> {
  try {
    const faceEntitySummary = await queryService.getFaceById(faceId);
    if (!faceEntitySummary || faceEntitySummary === null) {
      throw new NotFoundError(`Face with ID ${faceId} not found`);
    }

    const face = await toFace(faceEntitySummary.faceEntity, fileQueryService);

    const validatedFaceSummary = makeSafeUsecaseResult(FaceSummarySchema, {
      face: face,
      lastPostedAt: faceEntitySummary.lastPostedAt,
      numberOfPosts: faceEntitySummary.numberOfPosts,
    });
    return validatedFaceSummary;
  } catch (error) {
    console.error('Error fetching single face summary:', error);
    throw error;
  }
}
