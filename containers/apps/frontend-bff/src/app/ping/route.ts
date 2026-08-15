import { NextResponse } from 'next/server';

/**
 * トークンのリフレッシュを発火させるためだけの空のエンドポイント。
 * Server Action の裏側で 30秒ごとに叩くことで、
 * Middleware (proxy.ts) での Set-Cookie 握り潰しバグを回避する。
 */
export async function GET() {
  return new NextResponse('pong', { status: 200 });
}
