import { z } from 'zod';

import { EmailSchema, UserPasswordSchema } from '../../shared';

// サインインリクエストスキーマと型
export const AuthSignInRequestSchema = z.object({
  email: EmailSchema,
  password: UserPasswordSchema,
});
export type AuthSignInRequest = z.infer<typeof AuthSignInRequestSchema>;
