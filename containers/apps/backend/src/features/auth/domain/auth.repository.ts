import type { RefreshToken } from '@tracen/contracts';
import type { RefreshTokenData, ExpiresIn, FamilyId } from './auth.entity';

export type AuthRefreshTokenRepositorySpec = {
  saveToken: (token: RefreshToken, data: RefreshTokenData, expiresIn: ExpiresIn) => Promise<void>;
  revokeToken: (token: RefreshToken) => Promise<void>;
  findToken: (token: RefreshToken) => Promise<RefreshTokenData | null>;
  deleteToken: (token: RefreshToken) => Promise<void>;
  deleteAllTokensByFamilyId: (familyId: FamilyId) => Promise<void>;
};
