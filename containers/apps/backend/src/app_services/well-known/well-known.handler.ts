import { Hono } from 'hono';
import { AppEnv } from '../../shared/types/hono';

// RFC 7517に基づく、JSON Web Key Set (JWKS) を提供するエンドポイントを定義する
// そのため、レスポンスが他とは異なる形式になることに注意すること
export function wellKnownRouter() {
  return new Hono<AppEnv>().get('/jwks.json', (c) => {
    const jwks = c.get('config').JWKS_PUBLIC;
    if (!jwks) {
      return c.json({ error: 'JWKS is not initialized' }, 500);
    }
    // BFF側でキャッシュしやすいよう、適切なCache-Controlヘッダーをつけるのが一般的
    c.header('Cache-Control', 'public, max-age=86400'); // 24時間キャッシュを許可
    return c.json(jwks);
  });
}
