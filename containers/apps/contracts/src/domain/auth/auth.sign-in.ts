import { z } from 'zod';
import { UserResponseSchema } from '../user';

export const AuthSignInResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string().optional(), // success: falseのときのエラーメッセージ
    jwt: z.jwt().optional(), // サインイン成功時に発行されるJWT
    user: UserResponseSchema.optional(),
  })
  .strict();
export type AuthSignInResponse = z.infer<typeof AuthSignInResponseSchema>;
