import { z } from 'zod';
import { UserResponseSchema } from '../user';

export const AuthSignUpResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string().optional(), // success: falseのときのエラーメッセージ
    jwt: z.jwt().optional(), // サインアップ成功時に発行されるJWT
    user: UserResponseSchema.optional(),
  })
  .strict();
export type AuthSignUpResponse = z.infer<typeof AuthSignUpResponseSchema>;
