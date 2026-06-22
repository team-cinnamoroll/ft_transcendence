import { z } from 'zod';

import { EmailSchema, UserPasswordSchema } from '../../shared';

// サインアップリクエストスキーマと型
export const AuthSignUpRequestSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1),
  password: UserPasswordSchema,
});
export type AuthSignUpRequest = z.infer<typeof AuthSignUpRequestSchema>;
