import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import crypto from 'node:crypto';

import { type AuthHandlerEnv, injectAuthDeps } from '../auth.di';
import { SignInRequestSchema } from '@tracen/contracts';
import { signIn } from './sign-in.usecase';
import { createJWTPayload } from '../../../features/auth/domain/auth.entity';

// handlerでは入力に対してのバリデーションしかしない。出力のバリデーションはドメイン層で行う。

export function signInRouter() {
  return new Hono<AuthHandlerEnv>()
    .use('*', injectAuthDeps())
    .post('/', zValidator('json', SignInRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const userRepo = c.get('userRepo');
      const authPassWorker = c.get('authPassWorker');
      try {
        const response = await signIn(userRepo, authPassWorker, request);
        const jwtSecret = c.get('config').JWT_SECRET;
        if (response.success && response.user && jwtSecret) {
          const payload = createJWTPayload(response.user.id, 'user');
          const privateJwk = crypto.createPrivateKey(jwtSecret).export({ format: 'jwk' });
          const jwtToken = await sign(
            payload,
            { ...privateJwk, kid: 'key_v1', alg: 'RS256', use: 'sig' },
            'RS256'
          );
          return c.json({ ...response, jwt: jwtToken }, 201);
        }
        // success: false の場合はドメインエラー（例：emailまたはパスワードが無効）→ 401 Unauthorized
        return c.json(response, 401);
      } catch (err) {
        // 予期しないエラー（DB接続エラーなど）→ 500 Internal Server Error
        console.error('SignIn error:', err);
        return c.json(
          {
            success: false,
            message: 'Internal server error',
            user: undefined,
          },
          500
        );
      }
    });
}
