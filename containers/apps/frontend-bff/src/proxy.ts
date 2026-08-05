import { NextResponse, type NextRequest } from 'next/server';
import { decodeJwt } from 'jose';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { verifyToken } from './lib/backend-client';
import { getAuthRepository } from './repositories/auth-repository';
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

/** アクセストークンを検証し、無効/期限切れならリフレッシュトークンでの再発行を試みる */
async function resolveAuthState(request: NextRequest): Promise<AuthState> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { isAuthenticated: false, refreshedTokens: null, shouldClearSession: false };
  }

  const payload = await verifyToken(accessToken);
  if (payload?.sub) {
    return { isAuthenticated: true, refreshedTokens: null, shouldClearSession: false };
  }

  // アクセストークンが無効/期限切れ。リフレッシュトークンがあれば再発行を試みる
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const userId = decodeUserIdUnsafe(accessToken);
  if (!refreshToken || !userId) {
    return { isAuthenticated: false, refreshedTokens: null, shouldClearSession: true };
  }

  const result = await getAuthRepository().refresh(userId, refreshToken);
  if (result.success) {
    return { isAuthenticated: true, refreshedTokens: result.data, shouldClearSession: false };
  }
  return { isAuthenticated: false, refreshedTokens: null, shouldClearSession: true };
}

export default async function middleware(request: NextRequest) {
  const { locale, path } = resolveLocaleAwarePath(request.nextUrl.pathname);
  const { isAuthenticated, refreshedTokens, shouldClearSession } = await resolveAuthState(request);
  const isAuthPath = AUTH_PATHS.includes(path);

  let response: NextResponse;
  if (!PUBLIC_PATHS.includes(path) && !isAuthenticated && !isAuthPath) {
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
  } else if (shouldClearSession) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }

  return response;
}

export const config = {
  // API Route Handler、Next.js 内部パス、静的ファイルは除外する
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
