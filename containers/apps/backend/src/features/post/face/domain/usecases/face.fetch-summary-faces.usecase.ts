import { FaceQueryServiceSpec } from '../face.query-service';
import { FileQueryServiceSpec } from '../../../../../core-domain/file/file.query-service';
import type { QueryFaceRequest, FaceSummaryList } from '@tracen/contracts';
import { FaceSummaryListSchema } from '@tracen/contracts';
import { toFaces } from './face.mapper';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';

export async function fetchSummaryFacesByQuery(
  queryService: FaceQueryServiceSpec,
  fileQueryService: FileQueryServiceSpec,
  query: QueryFaceRequest
): Promise<FaceSummaryList> {
  try {
    const faceEntitySummaryList = await queryService.getFaceSummaryList(query);
    const faceEntities = faceEntitySummaryList.faceEntitySummaries.map(
      (summary) => summary.faceEntity
    );
    const faces = await toFaces(faceEntities, fileQueryService);

    const validatedFaceSummaryList = makeSafeUsecaseResult(FaceSummaryListSchema, {
      faceSummaries: faceEntitySummaryList.faceEntitySummaries.map((faceEntitySummary, index) => ({
        face: faces[index],
        lastPostedAt: faceEntitySummary.lastPostedAt,
        numberOfPosts: faceEntitySummary.numberOfPosts,
      })),
      nextCursor: faceEntitySummaryList.nextCursor,
    });
    return validatedFaceSummaryList;
  } catch (error) {
    console.error('Error fetching face summary list:', error);
    throw error;
  }
}
