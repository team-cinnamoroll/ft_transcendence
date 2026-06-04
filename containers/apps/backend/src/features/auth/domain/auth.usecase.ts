import { type RefreshToken } from '@tracen/contracts';
import { AuthAccessTokenWorkerSpec } from './auth.worker';
import { AuthRefreshTokenRepositorySpec } from './auth.repository';
import { createJWTPayload, createRefreshToken } from './auth.entity';
import { Config } from '../../../env';

export async function makeNewUserTokens(
  authAccessTokenWorker: AuthAccessTokenWorkerSpec,
  authRefreshTokenRepository: AuthRefreshTokenRepositorySpec,
  config: Config,
  userId: string
) {
  const accessTokenExpiresIn = config.ACCESS_TOKEN_EXPIRES_IN;
  const refreshTokenExpiresIn = config.REFRESH_TOKEN_EXPIRES_IN;
  const payload = createJWTPayload(userId, 'user', accessTokenExpiresIn);
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
) {
  const accessTokenExpiresIn = config.ACCESS_TOKEN_EXPIRES_IN;
  const refreshTokenExpiresIn = config.REFRESH_TOKEN_EXPIRES_IN;
  const payload = createJWTPayload(userId, 'user', accessTokenExpiresIn);
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
