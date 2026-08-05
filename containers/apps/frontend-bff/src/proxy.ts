import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { verifyToken } from './lib/backend-client';
import { ACCESS_TOKEN_COOKIE } from './lib/session';

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

export default async function middleware(request: NextRequest) {
  const { locale, path } = resolveLocaleAwarePath(request.nextUrl.pathname);

  if (!PUBLIC_PATHS.includes(path)) {
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const payload = accessToken ? await verifyToken(accessToken) : null;
    const isAuthenticated = payload?.sub != null;
    const isAuthPath = AUTH_PATHS.includes(path);

    if (!isAuthenticated && !isAuthPath) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/sign-in`;
      return NextResponse.redirect(url);
    }

    if (isAuthenticated && isAuthPath) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // API Route Handler、Next.js 内部パス、静的ファイルは除外する
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
