import 'server-only';

import type {
  AuthSignUpRequest,
  AuthSignInRequest,
  AuthSignUp,
  AuthSignIn,
  AuthRefresh,
} from '@/types/auth';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** AuthRepository が提供するメソッドの契約（Spec） */
export type AuthRepositorySpec = {
  /** サインアップ（ユーザー作成 + トークン発行） */
  signUp: (input: AuthSignUpRequest) => Promise<AuthSignUp>;
  /** ログイン（認証 + トークン発行） */
  signIn: (input: AuthSignInRequest) => Promise<AuthSignIn>;
  /** リフレッシュトークンによるアクセストークンの再発行 */
  refresh: (refreshToken: string) => Promise<AuthRefresh>;
  /** ログアウト（リフレッシュトークンの失効） */
  signOut: (refreshToken: string) => Promise<void>;
};

// ─── バックエンドAPI実装 ────────────────────────────────────────
// 認証をモックで再現する意味は薄いため、他の repository と異なりモック実装は用意せず、
// 最初からバックエンドAPIを呼ぶ実装のみを提供する（docs/frontend-bff/AUTH.md 参照）。

export function createAuthApiRepositoryImpl(): AuthRepositorySpec {
  return {
    signUp: async (input) => {
      const res = await createBackendClient().api.v1.auth['sign-up'].$post({ json: input });
      if (!res.ok) {
        console.error('AuthRepository.signUp: backend request failed', res.status);
      }
      return (await res.json()) as AuthSignUp;
    },

    signIn: async (input) => {
      const res = await createBackendClient().api.v1.auth['sign-in'].$post({ json: input });
      if (!res.ok) {
        console.error('AuthRepository.signIn: backend request failed', res.status);
      }
      return (await res.json()) as AuthSignIn;
    },

    refresh: async (refreshToken) => {
      const res = await createBackendClient().api.v1.auth.refresh.$post({
        json: { refreshToken },
      });
      if (!res.ok) {
        console.error('AuthRepository.refresh: backend request failed', res.status);
      }
      return (await res.json()) as AuthRefresh;
    },

    signOut: async (refreshToken) => {
      const res = await createBackendClient().api.v1.auth.refresh.$delete({
        json: { refreshToken },
      });
      if (!res.ok) {
        // ログアウトはベストエフォート: バックエンド呼び出しが失敗しても
        // 呼び出し側（Usecase）でローカルのセッション（Cookie）は必ず破棄する想定のため、
        // ここでは例外を投げず警告ログのみ残す。
        console.error('AuthRepository.signOut: backend request failed', res.status);
      }
    },
  };
}

export const authApiRepositoryImpl: AuthRepositorySpec = createAuthApiRepositoryImpl();

/** Provider: DI の入口（実装の選択はここに閉じ込める） */
export const getAuthRepository = createSingletonProvider<AuthRepositorySpec>(
  () => authApiRepositoryImpl
);
