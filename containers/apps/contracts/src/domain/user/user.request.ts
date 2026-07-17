import { z } from 'zod';

import { UserIdSchema } from './user';

// ユーザーデータのスキーマと型
export const UserIdParamSchema = z
  .union([z.object({ id: UserIdSchema }), z.object({ userId: UserIdSchema })])
  .transform((data) => {
    if ('userId' in data) {
      return { id: data.userId };
    }
    return data;
  });
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
