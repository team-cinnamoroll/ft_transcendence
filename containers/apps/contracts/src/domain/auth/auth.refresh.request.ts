import { z } from 'zod';
import { UserIdSchema } from '../user';
import { RefreshTokenSchema } from './auth.tokens';

export const AuthRefreshRequestSchema = z.object({
  userId: UserIdSchema, // クライアントから送信されるユーザーID
  refreshToken: RefreshTokenSchema, // クライアントから送信されるリフレッシュトークン
});
export type AuthRefreshRequest = z.infer<typeof AuthRefreshRequestSchema>;
