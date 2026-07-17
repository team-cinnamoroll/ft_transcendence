import { z } from 'zod';

import { UserStatusSchema } from '../user/user';

// 利用制限の変更リクエスト（対象ユーザーは path param、body は新しいステータス）
export const UpdateUserStatusRequestSchema = z
  .object({
    status: UserStatusSchema,
  })
  .strict();
export type UpdateUserStatusRequest = z.infer<typeof UpdateUserStatusRequestSchema>;
