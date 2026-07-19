import { type UserId, type RefreshToken } from '@tracen/contracts';
import { type AuthRefreshTokenRepositorySpec } from '../../../features/auth/domain/auth.repository';
import { ValidationError } from '../../../shared/errors/global.error';

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
): Promise<void> {
  if (!refreshToken) {
    await signOutAllTokensOfUser(repo, userId);
    return;
  }
  const tokenData = await repo.findToken(refreshToken);
  if (tokenData && tokenData.userId === userId) {
    await signOutByRefreshToken(repo, refreshToken);
    return;
  }
  throw new ValidationError('Invalid refresh token or user ID mismatch');
}
