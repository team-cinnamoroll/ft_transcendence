import type { QueryFaceRequest } from '@tracen/contracts';
import type { FaceEntitySummaryList } from './face.entity';

export interface FaceQueryServiceSpec {
  getFaceSummaryList: (query: QueryFaceRequest) => Promise<FaceEntitySummaryList>;
}
