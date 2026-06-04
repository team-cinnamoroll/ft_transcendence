import { z } from 'zod';
import { RefreshTokenSchema } from './auth.tokens';

export const AuthRefreshRequestSchema = z.object({
  refreshToken: RefreshTokenSchema, // クライアントから送信されるリフレッシュトークン
});
export type AuthRefreshRequest = z.infer<typeof AuthRefreshRequestSchema>;
