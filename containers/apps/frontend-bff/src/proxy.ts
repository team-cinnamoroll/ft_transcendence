import { NextResponse, type NextRequest } from 'next/server';
import { decodeJwt } from 'jose';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { verifyToken } from './lib/backend-client';
import { getAuthRepository, type AuthRepositorySpec } from './repositories/auth-repository';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  cookieOptions,
} from './lib/session';

const intlMiddleware = createMiddleware(routing);

// ログイン状態に関わらずそのまま表示するページ（ルート`/`は (app)/page.tsx 側でLP/ホームを出し分けるため対象外）
const PUBLIC_PATHS = ['/', '/privacy', '/terms', '/auth-check'];
// ログイン済みの場合のみホームへリダイレクトする認証ページ
const AUTH_PATHS = ['/sign-in', '/sign-up'];

/**
 * Server Action呼び出し(Next.jsが自動付与する `Next-Action` ヘッダー付きのリクエスト)かどうかを判定する。
 * Server Actionへの応答としてリダイレクトを返すと、ブラウザ側が期待するレスポンス形式と食い違い
 * 「An unexpected response was received from the server.」という Runtime Error になるため、
 * このリクエストには認証NGでもリダイレクトを返さない。
 */
function isServerActionRequest(request: NextRequest): boolean {
  return request.headers.has('next-action');
}

/** ロケールプレフィックスの有無に関わらず、現在のロケールとプレフィックスを除いたパスを求める */
function resolveLocaleAwarePath(pathname: string): { locale: string; path: string } {
  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    const rest = segments.slice(2).join('/');
    return { locale: maybeLocale, path: rest ? `/${rest}` : '/' };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

/**
 * 署名・期限を検証せず、中身をデコードするだけ。
 * 期限切れのアクセストークンは verifyToken() では読み取れないが、
 * リフレッシュAPI呼び出しに必要な userId だけはここから取り出す。
 * 最終的にバックエンド側で refreshToken と userId の組み合わせを検証するため、セキュリティ上の実害はない。
 */
function decodeUserIdUnsafe(accessToken: string): string | undefined {
  try {
    return decodeJwt(accessToken).sub;
  } catch {
    return undefined;
  }
}

type RefreshedTokens = { accessToken: string; refreshToken: string };

type AuthState = {
  isAuthenticated: boolean;
  /** リフレッシュに成功した場合の新しいトークン。Cookieへの書き込みが必要なことを表す */
  refreshedTokens: RefreshedTokens | null;
  /** リフレッシュに失敗した場合。中途半端な古いCookieを削除する必要があることを表す */
  shouldClearSession: boolean;
};

type RefreshResult = Awaited<ReturnType<AuthRepositorySpec['refresh']>>;

// 同一リフレッシュトークンに対して進行中のリフレッシュ処理を保持するキャッシュ。
// アクセストークン失効直後は、Next.jsのLink prefetch等により複数のリクエストがほぼ同時に
// このMiddlewareを通過する。それぞれが独立にbackendの/auth/refreshを呼ぶと、backend側の
// トークンローテーション(revoke直後の再利用をreuse detectionとみなす実装)が誤検知し、
// familyごとトークンが失効してセッションが切れてしまうため、同一プロセス内では1回にまとめる。
const inFlightRefreshes = new Map<string, Promise<RefreshResult>>();

function refreshTokens(userId: string, refreshToken: string): Promise<RefreshResult> {
  const ts = new Date().toISOString();
  console.log(`[Debug][${ts}] refreshTokens called. In-flight count: ${inFlightRefreshes.size}`);
  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) {
    console.log(`[Debug][${ts}] Found existing in-flight refresh promise. Reusing it.`);
    return existing;
  }
  console.log(`[Debug][${ts}] No existing refresh promise. Starting new API call.`);
  const promise = getAuthRepository()
    .refresh(userId, refreshToken)
    .finally(() => {
      inFlightRefreshes.delete(refreshToken);
    });
  inFlightRefreshes.set(refreshToken, promise);
  return promise;
}

/** アクセストークンを検証し、無効/期限切れならリフレッシュトークンでの再発行を試みる */
async function resolveAuthState(request: NextRequest): Promise<AuthState> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { isAuthenticated: false, refreshedTokens: null, shouldClearSession: false };
  }

  const payload = await verifyToken(accessToken);
  if (payload?.sub) {
    // [修正] JWTの残り有効期間をチェック
    // clockTolerance (5s) によって「すでに切れているが検証を通った」場合や、
    // バックエンド到達時（Server Componentでの処理時）に切れてしまうリスクを防ぐため、
    // 残り寿命が5秒以下ならリフレッシュ処理へフォールバックさせる
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp - nowInSeconds > 5) {
      return { isAuthenticated: true, refreshedTokens: null, shouldClearSession: false };
    }
    console.log(
      `[Debug][${new Date().toISOString()}] Token is close to expiration or in clockTolerance window (exp: ${payload.exp}, now: ${nowInSeconds}). Forcing refresh...`
    );
  }

  // アクセストークンが無効/期限切れ。リフレッシュトークンがあれば再発行を試みる
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const userId = decodeUserIdUnsafe(accessToken);
  if (!refreshToken || !userId) {
    return { isAuthenticated: false, refreshedTokens: null, shouldClearSession: true };
  }

  console.log(
    `[Debug][${new Date().toISOString()}] Token expired or invalid. Attempting to refresh for path: ${request.nextUrl.pathname}`
  );
  const result = await refreshTokens(userId, refreshToken);
  if (result.success) {
    return { isAuthenticated: true, refreshedTokens: result.data, shouldClearSession: false };
  }
  return { isAuthenticated: false, refreshedTokens: null, shouldClearSession: true };
}

export default async function middleware(request: NextRequest) {
  const { locale, path } = resolveLocaleAwarePath(request.nextUrl.pathname);
  const { isAuthenticated, refreshedTokens, shouldClearSession } = await resolveAuthState(request);

  // [修正] Server Component 側（以降の処理）でも新しいトークンを読み取れるように
  // request オブジェクトの Cookie も上書きしておく
  if (refreshedTokens) {
    request.cookies.set(ACCESS_TOKEN_COOKIE, refreshedTokens.accessToken);
    request.cookies.set(REFRESH_TOKEN_COOKIE, refreshedTokens.refreshToken);
  } else if (shouldClearSession) {
    request.cookies.delete(ACCESS_TOKEN_COOKIE);
    request.cookies.delete(REFRESH_TOKEN_COOKIE);
  }

  const isAuthPath = AUTH_PATHS.includes(path);
  const isServerAction = isServerActionRequest(request);

  let response: NextResponse;
  if (isServerAction) {
    // Server Actionへはリダイレクトを返さず、常にそのまま通す(認証NGの場合の扱いは呼び出し先のActionに委ねる)
    response = await intlMiddleware(request);
  } else if (!PUBLIC_PATHS.includes(path) && !isAuthenticated && !isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/sign-in`;
    response = NextResponse.redirect(url);
  } else if (isAuthenticated && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    response = NextResponse.redirect(url);
  } else {
    response = await intlMiddleware(request);
  }

  if (refreshedTokens) {
    response.cookies.set(
      ACCESS_TOKEN_COOKIE,
      refreshedTokens.accessToken,
      cookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS)
    );
    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      refreshedTokens.refreshToken,
      cookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS)
    );

    // Server Component (next/headers の cookies()) に新しいCookie状態を伝播させるための Next.js 内部ヘッダー
    const updatedCookieString = request.cookies
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
    response.headers.set('x-middleware-request-cookie', updatedCookieString);
  } else if (shouldClearSession) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);

    // クリアした場合も同様に状態を伝播させる
    const updatedCookieString = request.cookies
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
    response.headers.set('x-middleware-request-cookie', updatedCookieString);
  }

  return response;
}

export const config = {
  // API Route Handler、Next.js 内部パス、静的ファイルは除外する
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
