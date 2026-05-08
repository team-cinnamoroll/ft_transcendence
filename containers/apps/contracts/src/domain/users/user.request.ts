import { z } from 'zod';

import { EmailSchema } from '../../shared/primitives';
import { UserIdSchema } from './user';

// ユーザーデータのスキーマと型
export const UserIdParamSchema = z.object({
  id: UserIdSchema,
});
export type UserIdParam = z.infer<typeof UserIdParamSchema>;

// ユーザーデータの作成リクエストスキーマと型
export const CreateUserRequestSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1),
  password: z.string().min(8, '8文字以上必要です').max(64, 'パスワードが長すぎます'),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
