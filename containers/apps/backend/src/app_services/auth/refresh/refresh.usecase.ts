import { type AuthRefreshRequest } from '@tracen/contracts';
import {
  type RefreshTokenData,
  refreshTokenDataSchema,
} from '../../../features/auth/domain/auth.entity';
import { type AuthRefreshTokenRepositorySpec } from '../../../features/auth/domain/auth.repository';
import { makeSafeUsecaseResult } from '../../../shared/utils/validation';

export async function acceptRefreshRequest(
  repo: AuthRefreshTokenRepositorySpec,
  request: AuthRefreshRequest
): Promise<RefreshTokenData | null> {
  const existingTokenData = await repo.findToken(request.refreshToken);
  if (!existingTokenData) {
    return null; // トークンが見つからない場合はnullを返す
  }
  if (existingTokenData.userId !== request.userId) {
    return null; // トークンのユーザーIDがリクエストのユーザーIDと一致しない場合はnullを返す
  }
  if (existingTokenData.status !== 'active') {
    await repo.deleteAllTokensOfFamily(existingTokenData.familyId); // トークンが無効（revokedなど）の場合は同一familyIdのトークンを全て削除
    return null; // トークンが無効（revokedなど）の場合もnullを返す
  }
  return makeSafeUsecaseResult(refreshTokenDataSchema, existingTokenData);
}

export async function logoutByRefreshToken(
  repo: AuthRefreshTokenRepositorySpec,
  request: AuthRefreshRequest
): Promise<void> {
  const existingTokenData = await repo.findToken(request.refreshToken);
  if (!existingTokenData) {
    console.warn('Refresh token not found for logout:', request.refreshToken);
    return; // トークンが見つからない場合は何もしない
  }
  if (existingTokenData.userId !== request.userId) {
    console.warn(
      'User ID mismatch for logout. Token userId:',
      existingTokenData.userId,
      'Request userId:',
      request.userId
    );
    return; // トークンのユーザーIDがリクエストのユーザーIDと一致しない場合は何もしない
  }
  if (existingTokenData && existingTokenData.familyId) {
    await repo.deleteAllTokensOfFamily(existingTokenData.familyId);
  } else {
    await repo.deleteToken(request.refreshToken);
  }
}
