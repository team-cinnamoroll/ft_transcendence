import { type UserId, type RefreshToken, type SuccessResponse } from '@tracen/contracts';
import { type AuthRefreshTokenRepositorySpec } from '../../../features/auth/domain/auth.repository';

async function signOutByRefreshToken(
  repo: AuthRefreshTokenRepositorySpec,
  refreshToken: RefreshToken
): Promise<void> {
  const existingTokenData = await repo.findToken(refreshToken);
  if (existingTokenData && existingTokenData.familyId) {
    await repo.deleteAllTokensOfFamily(existingTokenData.familyId);
  } else {
    await repo.deleteToken(refreshToken);
  }
}

async function signOutAllTokensOfUser(
  repo: AuthRefreshTokenRepositorySpec,
  userId: UserId
): Promise<void> {
  await repo.deleteAllTokensOfUser(userId);
}

export async function signOutWithValidation(
  repo: AuthRefreshTokenRepositorySpec,
  refreshToken: RefreshToken | undefined,
  userId: UserId
): Promise<SuccessResponse> {
  if (!refreshToken) {
    await signOutAllTokensOfUser(repo, userId);
    return { success: true };
  }
  const tokenData = await repo.findToken(refreshToken);
  if (tokenData && tokenData.userId === userId) {
    await signOutByRefreshToken(repo, refreshToken);
    return { success: true };
  }
  return { success: false, message: 'Invalid refresh token or user ID mismatch' };
}
