import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { UserIdParamSchema } from '@tracen/contracts';
import { type UsersHandlerEnv, injectUsersDeps } from './users.di';
import { deleteUserById, getUserResponseById } from './domain/users.usecase';

// handlerでは入力に対してのバリデーションしかしない。出力のバリデーションはドメイン層で行う。

export function usersRouter() {
  return new Hono<UsersHandlerEnv>()
    .use('*', injectUsersDeps())
    .get('/:id', zValidator('param', UserIdParamSchema), async (c) => {
      const { id } = c.req.valid('param');
      const userRepo = c.get('userRepo');
      const userResponse = await getUserResponseById(userRepo, id);
      if (!userResponse) {
        return c.json({ message: 'user not found' }, 404);
      }
      return c.json(userResponse);
    })
    .delete('/:id', zValidator('param', UserIdParamSchema), async (c) => {
      const { id } = c.req.valid('param');
      const userRepo = c.get('userRepo');
      const deleted = await deleteUserById(userRepo, id);
      if (!deleted) {
        return c.json({ message: 'user not found' }, 404);
      }
      return c.body(null, 204);
    });
}
