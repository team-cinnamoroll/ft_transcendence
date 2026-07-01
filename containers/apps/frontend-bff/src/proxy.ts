import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // API Route Handler、Next.js 内部パス、静的ファイルは除外する
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
