import { AuthAccessTokenWorkerSpec } from './auth.worker';
import { AuthRefreshTokenRepositorySpec } from './auth.repository';
import { createJWTPayload, createNewRefreshToken } from './auth.entity';
import { Config } from '../../../env';

export async function makeUserTokens(
  authAccessTokenWorker: AuthAccessTokenWorkerSpec,
  authRefreshTokenRepository: AuthRefreshTokenRepositorySpec,
  config: Config,
  userId: string,
  familyId?: string
) {
  const accessTokenExpiresIn = config.ACCESS_TOKEN_EXPIRES_IN;
  const refreshTokenExpiresIn = config.REFRESH_TOKEN_EXPIRES_IN;
  const payload = createJWTPayload(userId, 'user', accessTokenExpiresIn);
  const accessToken = await authAccessTokenWorker.createJWT(payload);
  const newRefreshToken = createNewRefreshToken(userId, familyId);
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
