import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { SignUpRequestSchema } from '@tracen/contracts';

import type { AppEnv } from '../../../env';
import { requireDatabaseUrl } from '../../../shared/middleware/require-database-url';
import type { DatabaseUrlEnv } from '../../../shared/types/hono';

import { getUserRepository } from '../../../features/users/infra/users.repository';
import { getAuthPassWorker } from '../../../features/auth/infra/auth.worker';
import { signUp } from './sign-up.usecase';

// handlerでは入力に対してのバリデーションしかしない。出力のバリデーションはドメイン層で行う。

export function signUpRouter(env: AppEnv) {
  return new Hono<DatabaseUrlEnv>()
    .use('*', requireDatabaseUrl(env))
    .post('/', zValidator('json', SignUpRequestSchema), async (c) => {
      const request = c.req.valid('json');
      const repo = getUserRepository(c.get('databaseUrl'));
      const authWorker = getAuthPassWorker(c.get('databaseUrl'));
      const response = await signUp(repo, authWorker, request);
      if (response.success) {
        return c.json(response, 201);
      }
      return c.json(response, 409);
    });
}
