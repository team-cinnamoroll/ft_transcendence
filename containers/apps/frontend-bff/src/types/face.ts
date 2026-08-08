import type { FaceListResponse } from '@tracen/contracts';

export type {
  Face,
  CreateFaceRequest,
  UpdateFaceRequest,
  FaceSummary,
  FaceCreateResponse as FaceCreate,
  FaceUpdateResponse as FaceUpdate,
  FaceListResponse as FaceList,
  FaceSingleIdResponse as FaceSingleId,
} from '@tracen/contracts';

type SuccessData<T extends { success: true }> = T extends { data: infer D } ? D : never;

/** フェイス一覧APIのレスポンスから、成功時の data 部分だけを取り出した型 */
export type FaceListPage = SuccessData<Extract<FaceListResponse, { success: true }>>;
