import { z } from 'zod';
import { AccessTokenSchema, RefreshTokenSchema } from './auth.tokens';
import { UserResponseSchema } from '../user';

export const AuthSignInResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string().optional(), // success: falseのときのエラーメッセージ
    accessToken: AccessTokenSchema.optional(), // サインイン成功時に発行されるJWT
    refreshToken: RefreshTokenSchema.optional(), // サインイン成功時に発行されるリフレッシュトークン
    user: UserResponseSchema.optional(),
  })
  .strict();
export type AuthSignInResponse = z.infer<typeof AuthSignInResponseSchema>;
