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
      const response = await signUp(userRepo, authPassWorker, request);
      if (response.success) {
        return c.json(response, 201);
      }
      return c.json(response, 409);
    });
}
