import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type AuthHandlerEnv } from '../auth.di';
import { SignUpRequestSchema } from '@tracen/contracts';
import { signUp } from './sign-up.usecase';
import { createJWTPayload } from '../../../features/auth/domain/auth.entity';

// handlerでは入力に対してのバリデーションしかしない。出力のバリデーションはドメイン層で行う。

export function signUpRouter() {
  return new Hono<AuthHandlerEnv>().post(
    '/',
    zValidator('json', SignUpRequestSchema),
    async (c) => {
      const request = c.req.valid('json');
      const userRepo = c.get('userRepo');
      const authPassWorker = c.get('authPassWorker');
      const authTokenWorker = c.get('authTokenWorker');
      try {
        const response = await signUp(userRepo, authPassWorker, request);
        if (response.success && response.user) {
          const payload = createJWTPayload(response.user.id, 'user');
          const jwtToken = await authTokenWorker.createJWT(payload);
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
    }
  );
}
