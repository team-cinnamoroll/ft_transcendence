import { z } from 'zod';
import { RefreshTokenSchema } from './auth.tokens';

// サインアウトリクエストスキーマと型
export const SignOutRequestSchema = z.object({
  refreshToken: RefreshTokenSchema.optional(), // ログアウトさせるリフレッシュトークン（リフレッシュトークンがセットされていない場合は、ユーザーに紐づく全てのリフレッシュトークンを無効化する）
});
export type SignOutRequest = z.infer<typeof SignOutRequestSchema>;
