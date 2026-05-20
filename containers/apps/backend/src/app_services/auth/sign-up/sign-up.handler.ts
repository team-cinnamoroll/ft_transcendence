import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import crypto from 'node:crypto';

import { type AuthHandlerEnv, injectAuthDeps } from '../auth.di';
import { SignUpRequestSchema } from '@tracen/contracts';
import { signUp } from './sign-up.usecase';
import { createJWTPayload } from '../../../features/auth/domain/auth.entity';

// handlerでは入力に対してのバリデーションしかしない。出力のバリデーションはドメイン層で行う。

export function signUpRouter() {
  return new Hono<AuthHandlerEnv>()
    .use('*', injectAuthDeps())
    .post('/', zValidator('json', SignUpRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const userRepo = c.get('userRepo');
      const authPassWorker = c.get('authPassWorker');
      try {
        const response = await signUp(userRepo, authPassWorker, request);
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
        // success: false の場合はドメインエラー（例：email重複）→ 409 Conflict
        return c.json(response, 409);
      } catch (err) {
        // 予期しないエラー（DB接続エラーなど）→ 500 Internal Server Error
        console.error('SignUp error:', err);
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
