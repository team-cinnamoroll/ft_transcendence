import { z } from 'zod';
import crypto from 'crypto';
import {
  RefreshToken,
  UserId,
  UserIdSchema,
  Uuid,
  UuidSchema,
  IsoDateTimeStringSchema,
} from '@tracen/contracts';

export const expiresInSchema = z
  .string()
  // 例: "15m", "2h", "7d", "30s" などにマッチする正規表現
  .regex(/^\d+(s|m|h|d|w|y)$/, {
    message: "有効期限は '15m', '2h', '7d' のような形式（数値 + s/m/h/d/w/y）で指定してください",
  });
export type ExpiresIn = z.infer<typeof expiresInSchema>;

// JWTペイロード
export const jwtPayloadSchema = z.object({
  sub: z.string(), // ユーザーID（Subject）
  role: z.enum(['admin', 'user']), // 権限
  iss: z.url(), // 発行元
  // aud: z.string().optional(), // 利用者（オプション）
  // JWTの標準的なクレーム（必要に応じて）
  iat: z.number().optional(), // 発行時刻
  exp: z.number().optional(), // 有効期限時刻
});
export type JWTPayload = z.infer<typeof jwtPayloadSchema>;

export function createJWTPayload(
  userId: string,
  role: 'admin' | 'user',
  expiresIn: number
): JWTPayload {
  const now = Math.floor(Date.now() / 1000); // 現在のUnixタイムスタンプ
  return {
    sub: userId,
    role,
    iat: now, // 発行時刻を現在のUnixタイムスタンプで設定
    exp: now + expiresIn, // 有効期限を秒単位で設定
    iss: 'https://ft_transcendence.42.fr/', // 発行元を設定
  };
}

// refresh token
export const FamilyIdSchema = UuidSchema; // トークン世代の識別子（オプション）
export type FamilyId = Uuid;
export const refreshTokenDataSchema = z.object({
  userId: UserIdSchema,
  createdAt: IsoDateTimeStringSchema, // 発行時のUnixタイムスタンプ（ミリ秒）
  familyId: FamilyIdSchema, // トークン世代の識別子
});
export type RefreshTokenData = z.infer<typeof refreshTokenDataSchema>;

export function createNewRefreshToken(
  userId: UserId,
  existingFamilyId?: FamilyId
): { token: RefreshToken; data: RefreshTokenData } {
  const token = crypto.randomUUID() as RefreshToken;
  const data: RefreshTokenData = {
    userId,
    createdAt: new Date().toISOString(),
    familyId: existingFamilyId ?? (crypto.randomUUID() as FamilyId), // 新しいトークン世代の識別子を生成
  };
  return { token, data };
}
