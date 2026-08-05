import 'server-only';

import { cookies } from 'next/headers';

// Middleware（src/proxy.ts）は next/headers の cookies() が使えないため、
// Cookie名をここから import して request.cookies を直接参照する。
export const ACCESS_TOKEN_COOKIE = 'mf_access_token';
export const REFRESH_TOKEN_COOKIE = 'mf_refresh_token';

// backend の env.ts / .env.dev のデフォルト値と揃えている（秒単位）。
// backend側の ACCESS_TOKEN_EXPIRES_IN / REFRESH_TOKEN_EXPIRES_IN を変更した場合はこちらも更新する。
const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 15; // 15分
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7日

function cookieOptions(maxAgeSeconds: number) {
  return {
    // Cookieをブラウザ上のJavaScriptから読めなくする設定
    httpOnly: true,
    // 他サイトを経由した不正なリクエスト（CSRF）にはCookieを付けないようにする設定
    sameSite: 'lax' as const,
    // 開発環境（HTTP）ではsecure Cookieが保存されないため、本番相当環境（HTTPS）でのみ有効にする
    secure: process.env.NODE_ENV === 'production',
    // サイト内のどのページ宛のリクエストでもこのCookieを送るようにする設定
    path: '/',
    // このCookieが何秒後に自動的に消えるかの設定（呼び出し元ごとに異なる値を渡す）
    maxAge: maxAgeSeconds,
  };
}

/** サインアップ/ログイン成功時に、発行されたトークンをCookieへ保存する */
export async function setSessionTokens(accessToken: string, refreshToken: string): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS));
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS));
}

/** ログアウト時に、Cookieに保存したトークンを削除する */
export async function clearSessionTokens(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export type SessionTokens = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
};

/** Cookieに保存されているトークンを読み取る（未ログインの場合はどちらもundefined） */
export async function getSessionTokens(): Promise<SessionTokens> {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}
