import { z } from 'zod';
import { AccessTokenSchema, RefreshTokenSchema } from './auth.tokens';
import { UserResponseSchema } from '../user';
import { SuccessResponseSchema } from '../../shared/response';

export const AuthSignUpResponseSchema = SuccessResponseSchema.extend({
  accessToken: AccessTokenSchema.optional(), // サインアップ成功時に発行されるJWT
  refreshToken: RefreshTokenSchema.optional(), // サインアップ成功時に発行されるリフレッシュトークン
  user: UserResponseSchema.optional(),
}).strict();

export type AuthSignUpResponse = z.infer<typeof AuthSignUpResponseSchema>;
