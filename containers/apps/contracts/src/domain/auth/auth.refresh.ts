import { z } from 'zod';
import { AccessTokenSchema, RefreshTokenSchema } from './auth.tokens';

export const AuthRefreshResponseSchema = z.object({
  accessToken: AccessTokenSchema, // 新しいJWT
  refreshToken: RefreshTokenSchema, // 新しいリフレッシュトークン
});
export type AuthRefreshResponse = z.infer<typeof AuthRefreshResponseSchema>;
