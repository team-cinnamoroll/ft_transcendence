import 'server-only';

import type { AuthSignUpRequest, AuthSignInRequest, AuthSignUp, AuthSignIn } from '@/types/auth';
import { getAuthRepository } from '@/repositories/auth-repository';
import { setSessionTokens, clearSessionTokens, getSessionTokens } from '@/lib/session';
import { verifyToken } from '@/lib/backend-client';

/** サインアップし、成功した場合は発行されたトークンでセッションを開始する */
export async function signUpAndStartSession(input: AuthSignUpRequest): Promise<AuthSignUp> {
  const result = await getAuthRepository().signUp(input);
  if (result.success && result.data.accessToken && result.data.refreshToken) {
    await setSessionTokens(result.data.accessToken, result.data.refreshToken);
  }
  return result;
}

/** ログインし、成功した場合は発行されたトークンでセッションを開始する */
export async function signInAndStartSession(input: AuthSignInRequest): Promise<AuthSignIn> {
  const result = await getAuthRepository().signIn(input);
  if (result.success && result.data.accessToken && result.data.refreshToken) {
    await setSessionTokens(result.data.accessToken, result.data.refreshToken);
  }
  return result;
}

/** ログアウトする。Cookieのリフレッシュトークンでバックエンドに失効を伝えた上で、ローカルのセッションを破棄する */
export async function signOutAndClearSession(): Promise<void> {
  const { refreshToken } = await getSessionTokens();
  if (refreshToken) {
    await getAuthRepository().signOut(refreshToken);
  }
  await clearSessionTokens();
}

export type AuthSession = {
  userId: string;
  accessToken: string;
};

/**
 * 現在ログイン中かどうかを判定する。
 * アクセストークンの署名・有効期限を検証するだけで、バックエンドへの問い合わせは発生しない。
 * トークンが無効・期限切れの場合は自動リフレッシュせず、素直に「未ログイン」として扱う
 * （理由は docs/frontend-bff/AUTH.md の「6. 今回実装しないもの」を参照）。
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return null;
  }
  const payload = await verifyToken(accessToken);
  if (!payload?.sub) {
    return null;
  }
  return { userId: payload.sub, accessToken };
}
