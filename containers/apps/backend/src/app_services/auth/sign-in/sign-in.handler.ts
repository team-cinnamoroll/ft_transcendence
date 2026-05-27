import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { type AuthHandlerEnv } from '../auth.di';
import { SignInRequestSchema } from '@tracen/contracts';
import { signIn } from './sign-in.usecase';
import { createJWTPayload } from '../../../features/auth/domain/auth.entity';

// handlerでは入力に対してのバリデーションしかしない。出力のバリデーションはドメイン層で行う。

export function signInRouter() {
  return new Hono<AuthHandlerEnv>().post(
    '/',
    zValidator('json', SignInRequestSchema),
    async (c) => {
      const request = c.req.valid('json');
      const userRepo = c.get('userRepo');
      const authPassWorker = c.get('authPassWorker');
      const authTokenWorker = c.get('authTokenWorker');
      try {
        const response = await signIn(userRepo, authPassWorker, request);
        if (response.success && response.user) {
          const payload = createJWTPayload(response.user.id, 'user');
          const jwtToken = await authTokenWorker.createJWT(payload);
          return c.json({ ...response, jwt: jwtToken }, 200);
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
    }
  );
}
