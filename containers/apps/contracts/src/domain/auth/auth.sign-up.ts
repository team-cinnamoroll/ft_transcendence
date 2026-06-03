import { z } from 'zod';
import { AccessTokenSchema, RefreshTokenSchema } from './auth.tokens';
import { UserResponseSchema } from '../user';

export const AuthSignUpResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string().optional(), // success: falseのときのエラーメッセージ
    accessToken: AccessTokenSchema.optional(), // サインアップ成功時に発行されるJWT
    refreshToken: RefreshTokenSchema.optional(), // サインアップ成功時に発行されるリフレッシュトークン
    user: UserResponseSchema.optional(),
  })
  .strict();
export type AuthSignUpResponse = z.infer<typeof AuthSignUpResponseSchema>;
