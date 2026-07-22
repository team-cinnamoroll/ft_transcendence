import 'server-only';

import type {
  AuthSignUpRequest,
  AuthSignInRequest,
  AuthSignUp,
  AuthSignIn,
  AuthSignUpResult,
  AuthSignInResult,
  AuthRefresh,
} from '@/types/auth';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';
import { classifyHttpStatus } from '@/lib/api-error';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** AuthRepository が提供するメソッドの契約（Spec） */
export type AuthRepositorySpec = {
  /** サインアップ（ユーザー作成 + トークン発行） */
  signUp: (input: AuthSignUpRequest) => Promise<AuthSignUpResult>;
  /** ログイン（認証 + トークン発行） */
  signIn: (input: AuthSignInRequest) => Promise<AuthSignInResult>;
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
      const json = (await res.json()) as AuthSignUp;
      if (!res.ok) {
        // backend の生 message はログ用途のみ。画面表示には errorKind を使う（i18n非依存にするため）
        console.error(
          'AuthRepository.signUp: backend request failed',
          res.status,
          'message' in json ? json.message : undefined
        );
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      return json as AuthSignUpResult;
    },

    signIn: async (input) => {
      const res = await createBackendClient().api.v1.auth['sign-in'].$post({ json: input });
      const json = (await res.json()) as AuthSignIn;
      if (!res.ok) {
        // backend の生 message はログ用途のみ。画面表示には errorKind を使う（i18n非依存にするため）
        console.error(
          'AuthRepository.signIn: backend request failed',
          res.status,
          'message' in json ? json.message : undefined
        );
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      return json as AuthSignInResult;
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
      // signOutだけ複数回リトライしている理由:
      // - signUp/signIn/refreshは「意味のある結果」を返す約束（例: Promise<AuthSignUp>）をしているため、
      //   通信が一時的に不調でも、リトライで誤魔化さずその場で失敗を呼び出し元に伝えるべき処理。
      // - 一方signOutは「削除に成功したか」を呼び出し元に一切伝えない（Promise<void>）。
      //   1回失敗しただけで諦めてしまうと、本来なら一瞬の通信不調で成功したはずの削除まで
      //   見逃してしまう。返り値で失敗を伝えられない分、ここで粘って確実性を上げる必要がある。
      //
      // なお、これはあくまで「一時的な不調」を救うための軽い対応であり、
      // バックエンド自体が長時間停止しているような障害までは救えない（docs/frontend-bff/AUTH.md 参照）。
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await createBackendClient().api.v1.auth.refresh.$delete({
            json: { refreshToken },
          });
          if (res.ok) return;
          console.error(
            `AuthRepository.signOut: backend request failed (attempt ${attempt}/${maxAttempts})`,
            res.status
          );
        } catch (err) {
          console.error(
            `AuthRepository.signOut: request threw (attempt ${attempt}/${maxAttempts})`,
            err
          );
        }
      }
      // ここまで来たら全て失敗。ログアウトはベストエフォートなので、これ以上は追わず
      // 呼び出し側（Usecase）でのローカルセッション（Cookie）破棄に処理を委ねる。
    },
  };
}

export const authApiRepositoryImpl: AuthRepositorySpec = createAuthApiRepositoryImpl();

/** Provider: DI の入口（実装の選択はここに閉じ込める） */
export const getAuthRepository = createSingletonProvider<AuthRepositorySpec>(
  () => authApiRepositoryImpl
);
