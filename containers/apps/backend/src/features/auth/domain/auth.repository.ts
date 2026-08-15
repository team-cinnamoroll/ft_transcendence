import type { RefreshToken, UserId } from '@tracen/contracts';
import type { RefreshTokenData, ExpiresIn, FamilyId } from './auth.entity';

export type ActiveFamilyToken = { token: RefreshToken; data: RefreshTokenData };

export type AuthRefreshTokenRepositorySpec = {
  saveToken: (token: RefreshToken, data: RefreshTokenData, expiresIn: ExpiresIn) => Promise<void>;
  revokeToken: (token: RefreshToken) => Promise<void>;
  findToken: (token: RefreshToken) => Promise<RefreshTokenData | null>;
  /** familyId に属する現在アクティブなトークンを1つ探す（再利用の猶予期間判定で使う） */
  findActiveTokenOfFamily: (familyId: FamilyId) => Promise<ActiveFamilyToken | null>;
  deleteToken: (token: RefreshToken) => Promise<void>;
  deleteAllTokensOfFamily: (familyId: FamilyId) => Promise<void>;
  deleteAllTokensOfUser: (userId: UserId) => Promise<void>;
};
