import { z } from 'zod';

import { UserIdSchema } from './user';

// ユーザーデータのスキーマと型
export const UserIdParamSchema = z.object({
  id: UserIdSchema,
});
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
