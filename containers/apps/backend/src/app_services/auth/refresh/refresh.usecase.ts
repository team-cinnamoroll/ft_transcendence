import { type AuthRefreshRequest, type RefreshToken } from '@tracen/contracts';
import {
  type RefreshTokenData,
  refreshTokenDataSchema,
} from '../../../features/auth/domain/auth.entity';
import { type AuthRefreshTokenRepositorySpec } from '../../../features/auth/domain/auth.repository';

export async function fetchExistingRefreshTokenData(
  repo: AuthRefreshTokenRepositorySpec,
  request: AuthRefreshRequest
): Promise<RefreshTokenData | null> {
  const existingTokenData = await repo.findToken(request.refreshToken);
  if (!existingTokenData) {
    return null; // トークンが見つからない場合はnullを返す
  }
  return refreshTokenDataSchema.parse(existingTokenData);
}

export async function logoutByRefreshToken(
  repo: AuthRefreshTokenRepositorySpec,
  refreshToken: RefreshToken
): Promise<void> {
  const existingTokenData = await repo.findToken(refreshToken);
  if (existingTokenData && existingTokenData.familyId) {
    await repo.deleteAllTokensByFamilyId(existingTokenData.familyId);
  } else {
    await repo.deleteToken(refreshToken);
  }
}
