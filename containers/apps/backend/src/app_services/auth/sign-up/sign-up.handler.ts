import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type AuthHandlerEnv, injectAuthDeps } from '../auth.di';
import { SignUpRequestSchema } from '@tracen/contracts';
import { signUp } from './sign-up.usecase';

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
        if (response.success) {
          return c.json(response, 201);
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
