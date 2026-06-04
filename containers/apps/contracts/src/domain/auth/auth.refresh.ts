import { z } from 'zod';
import { AccessTokenSchema, RefreshTokenSchema } from './auth.tokens';
import { SuccessResponseSchema } from '../../shared/response';

export const AuthRefreshResponseSchema = SuccessResponseSchema.extend({
  accessToken: AccessTokenSchema.optional(), // 新しいJWT
  refreshToken: RefreshTokenSchema.optional(), // 新しいリフレッシュトークン
});
export type AuthRefreshResponse = z.infer<typeof AuthRefreshResponseSchema>;
