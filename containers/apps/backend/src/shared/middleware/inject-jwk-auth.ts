import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { jwk } from 'hono/jwk';
import { type AppEnv, type ProtectedEnv } from '../types/hono';
import { makeSafeResponse } from '../utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

// 現状は鍵ローテーションを考慮していないため、外部サービスが発行するJWTを使用する場合は、追加実装が必要になる

export const injectJwtAuthDeps = () => {
  const jwkHandler = jwk({
    keys: async (c: Context<AppEnv>) => {
      const jwksCache = c.get('config').JWKS_PUBLIC;
      return jwksCache ? jwksCache.keys : [];
    },
    alg: ['RS256'],
  });

  // 1つの統合されたミドルウェアとしてラップして返す
  return createMiddleware<ProtectedEnv>(async (c, next) => {
    let isJwkPassed = false;

    // ① jwkミドルウェアを内部で実行する
    // 検証を通過した時だけ true になるダミーの next 関数を渡す
    await jwkHandler(c, async () => {
      isJwkPassed = true;
    });

    // jwk検証に失敗（401等）してレスポンスが確定した場合は、ここで処理を終了
    if (!isJwkPassed)
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Unauthorized: Invalid JWT',
        }),
        401
      );

    // ② 自社宛てクレームのチェック
    const payload = c.get('jwtPayload');
    if (!payload || !payload.sub) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Unauthorized: Invalid JWT',
        }),
        401
      );
    }

    const expectedIssuer = c.get('config').JWT_ISSUER;

    // audは設定していないため、issだけをチェックする

    if (!payload || payload.iss !== expectedIssuer) {
      return c.json(
        makeSafeResponse(SimpleApiResponseSchema, {
          success: false,
          message: 'Unauthorized: Invalid issuer',
        }),
        401
      );
    }

    // すべての関門を突破したら、本来の次の処理（ルーティングなど）へ進む
    await next();
  });
};
