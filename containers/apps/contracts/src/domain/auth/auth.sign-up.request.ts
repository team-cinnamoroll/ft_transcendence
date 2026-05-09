import { z } from 'zod';

import { EmailSchema, UserPasswordSchema } from '../../shared';

// サインアップリクエストスキーマと型
export const SignUpRequestSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1),
  password: UserPasswordSchema,
});
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
