import crypto from 'crypto';
import { type RefreshToken, RefreshTokenSchema, UserId } from '@tracen/contracts';
import { AuthAccessTokenWorkerSpec } from './auth.worker';
import { AuthRefreshTokenRepositorySpec } from './auth.repository';
import {
  jwtPayloadSchema,
  JWTPayload,
  FamilyId,
  FamilyIdSchema,
  RefreshTokenData,
  refreshTokenDataSchema,
} from './auth.entity';
import { Config } from '../../../env';
import { makeSafeUsecaseResult } from '../../../shared/utils/validation';

function createJWTPayload(
  userId: string,
  role: 'admin' | 'user',
  expiresIn: number,
  issuer: string
): JWTPayload {
  const now = Math.floor(Date.now() / 1000); // 現在のUnixタイムスタンプ
  return makeSafeUsecaseResult(jwtPayloadSchema, {
    sub: userId,
    role,
    iat: now, // 発行時刻を現在のUnixタイムスタンプで設定
    exp: now + expiresIn, // 有効期限を秒単位で設定
    iss: issuer, // 発行元を設定
  });
}

function createRefreshToken(
  userId: UserId,
  existingFamilyId?: FamilyId
): { token: RefreshToken; data: RefreshTokenData } {
  const token = makeSafeUsecaseResult(RefreshTokenSchema, crypto.randomUUID());
  const data = makeSafeUsecaseResult(refreshTokenDataSchema, {
    userId,
    createdAt: new Date().toISOString(),
    familyId: existingFamilyId ?? makeSafeUsecaseResult(FamilyIdSchema, crypto.randomUUID()), // 新しいトークン世代の識別子を生成
    status: 'active',
  });
  return { token, data };
}

export async function makeNewUserTokens(
  authAccessTokenWorker: AuthAccessTokenWorkerSpec,
  authRefreshTokenRepository: AuthRefreshTokenRepositorySpec,
  config: Config,
  userId: string
): Promise<{ accessToken: string; refreshToken: RefreshToken }> {
  const accessTokenExpiresIn = config.ACCESS_TOKEN_EXPIRES_IN;
  const refreshTokenExpiresIn = config.REFRESH_TOKEN_EXPIRES_IN;
  const issuer = config.JWT_ISSUER;
  const payload = createJWTPayload(userId, 'user', accessTokenExpiresIn, issuer);
  const accessToken = await authAccessTokenWorker.createJWT(payload);
  const newRefreshToken = createRefreshToken(userId);
  await authRefreshTokenRepository.saveToken(
    newRefreshToken.token,
    newRefreshToken.data,
    refreshTokenExpiresIn
  );
  return {
    accessToken,
    refreshToken: newRefreshToken.token,
  };
}

export async function refreshUserTokens(
  authAccessTokenWorker: AuthAccessTokenWorkerSpec,
  authRefreshTokenRepository: AuthRefreshTokenRepositorySpec,
  config: Config,
  oldRefreshToken: RefreshToken,
  userId: string,
  familyId: string
): Promise<{ accessToken: string; refreshToken: RefreshToken }> {
  const accessTokenExpiresIn = config.ACCESS_TOKEN_EXPIRES_IN;
  const refreshTokenExpiresIn = config.REFRESH_TOKEN_EXPIRES_IN;
  const issuer = config.JWT_ISSUER;
  const payload = createJWTPayload(userId, 'user', accessTokenExpiresIn, issuer);
  const accessToken = await authAccessTokenWorker.createJWT(payload);
  const newRefreshToken = createRefreshToken(userId, familyId);
  await authRefreshTokenRepository.revokeToken(oldRefreshToken); // トークンを使用済みにする（状態をrevokedに変更）
  await authRefreshTokenRepository.saveToken(
    newRefreshToken.token,
    newRefreshToken.data,
    refreshTokenExpiresIn
  );
  return {
    accessToken,
    refreshToken: newRefreshToken.token,
  };
}
