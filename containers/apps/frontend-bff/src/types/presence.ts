import type { PresenceStatusResponse } from '@tracen/contracts';

export type { PresenceStatusResponse } from '@tracen/contracts';

type SuccessData<T extends { success: true }> = T extends { data: infer D } ? D : never;

/** オンライン状態一括取得APIのレスポンスから、成功時の data 部分だけを取り出した型 */
export type PresenceStatusData = SuccessData<Extract<PresenceStatusResponse, { success: true }>>;
