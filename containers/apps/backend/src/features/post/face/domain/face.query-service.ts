import type { QueryFaceRequest, FaceId } from '@tracen/contracts';
import type { FaceEntitySummary, FaceEntitySummaryList } from './face.entity';

export interface FaceQueryServiceSpec {
  getFaceSummaryList: (query: QueryFaceRequest) => Promise<FaceEntitySummaryList>;
  getFaceById: (id: FaceId) => Promise<FaceEntitySummary | null>;
}
