import { z } from 'zod';

export const expiresInSchema = z
  .string()
  // 例: "15m", "2h", "7d", "30s" などにマッチする正規表現
  .regex(/^\d+(s|m|h|d|w|y)$/, {
    message: "有効期限は '15m', '2h', '7d' のような形式（数値 + s/m/h/d/w/y）で指定してください",
  });
export type ExpiresIn = z.infer<typeof expiresInSchema>;

// アプリケーションが期待するJWTペイロードのスキーマ
export const jwtPayloadSchema = z.object({
  sub: z.string(), // ユーザーID（Subject）
  role: z.enum(['admin', 'user']), // 権限
  iss: z.url(), // 発行元
  // aud: z.string().optional(), // 利用者（オプション）
  // JWTの標準的なクレーム（必要に応じて）
  iat: z.number().optional(), // 発行時刻
  exp: z.number().optional(), // 有効期限時刻
});

// 型を抽出
export type JWTPayload = z.infer<typeof jwtPayloadSchema>;
export function createJWTPayload(userId: string, role: 'admin' | 'user'): JWTPayload {
  const now = Math.floor(Date.now() / 1000); // 現在のUnixタイムスタンプ
  return {
    sub: userId,
    role,
    iat: now, // 発行時刻を現在のUnixタイムスタンプで設定
    exp: now + 60 * 15, // 有効期限を15分後に設定
    iss: 'https://ft_transcendence.42.fr/', // 発行元を設定
  };
}
