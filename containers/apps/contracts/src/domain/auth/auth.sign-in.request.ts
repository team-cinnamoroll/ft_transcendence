import { z } from 'zod';

import { EmailSchema, UserPasswordSchema } from '../../shared';

// サインインリクエストスキーマと型
export const SignInRequestSchema = z.object({
  email: EmailSchema,
  password: UserPasswordSchema,
});
export type SignInRequest = z.infer<typeof SignInRequestSchema>;
