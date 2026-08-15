import { z } from 'zod';
import { UserIdSchema, Uuid, UuidSchema, IsoDateTimeStringSchema } from '@tracen/contracts';

export const expiresInSchema = z
  .string()
  // 例: "15m", "2h", "7d", "30s" などにマッチする正規表現
  .regex(/^\d+(s|m|h|d|w|y)$/, {
    message: "有効期限は '15m', '2h', '7d' のような形式（数値 + s/m/h/d/w/y）で指定してください",
  });
export type ExpiresIn = z.infer<typeof expiresInSchema>;

// APIkey
export const ApiKeySchema = z.string().min(1);
export type ApiKey = z.infer<typeof ApiKeySchema>;

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

// refresh token
export const FamilyIdSchema = UuidSchema; // トークン世代の識別子（オプション）
export type FamilyId = Uuid;
export const refreshTokenDataSchema = z.object({
  userId: UserIdSchema,
  createdAt: IsoDateTimeStringSchema, // 発行時刻（ISO 8601）
  familyId: FamilyIdSchema, // トークン世代の識別子
  status: z.enum(['active', 'revoked']).default('active'), // トークンの状態
  // status が 'revoked' になった時刻（ISO 8601）。再利用検知の猶予期間判定に使う。
  revokedAt: IsoDateTimeStringSchema.optional(),
});
export type RefreshTokenData = z.infer<typeof refreshTokenDataSchema>;
