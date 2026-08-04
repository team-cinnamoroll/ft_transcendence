import type { SeedListResponse } from '@tracen/contracts';

export type {
  Seed,
  CreateSeedRequest,
  UpdateSeedRequest,
  SeedCreateResponse as SeedCreate,
  SeedUpdateResponse as SeedUpdate,
  SeedListResponse as SeedList,
} from '@tracen/contracts';

type SuccessData<T extends { success: true }> = T extends { data: infer D } ? D : never;

/** シード一覧APIのレスポンスから、成功時の data 部分だけを取り出した型 */
export type SeedListPage = SuccessData<Extract<SeedListResponse, { success: true }>>;
