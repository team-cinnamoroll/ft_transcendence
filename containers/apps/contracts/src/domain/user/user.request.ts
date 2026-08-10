import { z } from 'zod';

import { EmailSchema, UserPasswordSchema } from '../../shared';
import { UserIdSchema } from './user';

export const UserCredentialsSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1),
  password: UserPasswordSchema,
});

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

// UPDATE
export const UserUpdateRequestSchema = UserCredentialsSchema.extend({
  newPassword: UserPasswordSchema.nullable(),
}).strict();
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
