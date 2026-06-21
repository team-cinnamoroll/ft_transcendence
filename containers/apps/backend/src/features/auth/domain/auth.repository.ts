import type { RefreshToken, UserId } from '@tracen/contracts';
import type { RefreshTokenData, ExpiresIn, FamilyId } from './auth.entity';

export type AuthRefreshTokenRepositorySpec = {
  saveToken: (token: RefreshToken, data: RefreshTokenData, expiresIn: ExpiresIn) => Promise<void>;
  revokeToken: (token: RefreshToken) => Promise<void>;
  findToken: (token: RefreshToken) => Promise<RefreshTokenData | null>;
  deleteToken: (token: RefreshToken) => Promise<void>;
  deleteAllTokensOfFamily: (familyId: FamilyId) => Promise<void>;
  deleteAllTokensOfUser: (userId: UserId) => Promise<void>;
};
