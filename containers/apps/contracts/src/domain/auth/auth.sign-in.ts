import { z } from 'zod';
import { AccessTokenSchema, RefreshTokenSchema } from './auth.tokens';
import { UserResponseSchema } from '../user';
import { SuccessResponseSchema } from '../../shared/response';

export const AuthSignInResponseSchema = SuccessResponseSchema.extend({
  accessToken: AccessTokenSchema.optional(), // サインイン成功時に発行されるJWT
  refreshToken: RefreshTokenSchema.optional(), // サインイン成功時に発行されるリフレッシュトークン
  user: UserResponseSchema.optional(),
}).strict();

export type AuthSignInResponse = z.infer<typeof AuthSignInResponseSchema>;
