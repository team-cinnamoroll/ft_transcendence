import { z } from 'zod';
import { RefreshTokenSchema } from './auth.tokens';

// サインアウトリクエストスキーマと型
export const AuthSignOutRequestSchema = z.object({
  refreshToken: RefreshTokenSchema.optional(), // ログアウトさせるリフレッシュトークン（リフレッシュトークンがセットされていない場合は、ユーザーに紐づく全てのリフレッシュトークンを無効化する）
});
export type AuthSignOutRequest = z.infer<typeof AuthSignOutRequestSchema>;
