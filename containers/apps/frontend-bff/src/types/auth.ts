import type {
  AuthSignUpRequest,
  AuthSignInRequest,
  AuthSignUpResponse,
  AuthSignInResponse,
  AuthRefreshResponse,
} from '@tracen/contracts';
import type { ApiResult } from '@/lib/api-error';

export type {
  AuthSignUpRequest,
  AuthSignInRequest,
  AuthSignUpResponse as AuthSignUp,
  AuthSignInResponse as AuthSignIn,
  AuthRefreshResponse as AuthRefresh,
};

type AuthSignUpData = Extract<AuthSignUpResponse, { success: true }>['data'];
type AuthSignInData = Extract<AuthSignInResponse, { success: true }>['data'];

/**
 * Repository / Usecase 層で扱う内部結果型。
 * backend の生 message の代わりに、言語非依存の ApiErrorKind を持つ（`ApiResult` 参照）。
 * 表示用の翻訳済みメッセージへの変換は Server Actions 層で行う。
 */
export type AuthSignUpResult = ApiResult<AuthSignUpData>;
export type AuthSignInResult = ApiResult<AuthSignInData>;
