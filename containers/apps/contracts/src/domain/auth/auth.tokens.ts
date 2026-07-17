import { z } from 'zod';
import { Uuid, UuidSchema } from '../../shared/primitives';

export const AccessTokenSchema = z.jwt(); // JWTはZodの組み込みスキーマで表現
export type AccessToken = z.infer<typeof AccessTokenSchema>;

export const RefreshTokenSchema = UuidSchema; // トークン自体はUUIDで表現
export type RefreshToken = Uuid;

export const AuthTokensDataSchema = z
  .object({
    accessToken: AccessTokenSchema, // 新しいJWT
    refreshToken: RefreshTokenSchema, // 新しいリフレッシュトークン
  })
  .strict();
export type AuthTokensData = z.infer<typeof AuthTokensDataSchema>;
