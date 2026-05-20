import { Hono } from 'hono';

import { type AuthHandlerEnv, injectAuthDeps } from './auth.di';
import { signUpRouter } from './sign-up/sign-up.handler';
import { signInRouter } from './sign-in/sign-in.handler';

// handlerでは入力に対してのバリデーションしかしない。出力のバリデーションはドメイン層で行う。

export function authRouter() {
  return new Hono<AuthHandlerEnv>()
    .use('*', injectAuthDeps())
    .route('/sign-up', signUpRouter())
    .route('/sign-in', signInRouter());
}
