import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { createUserSchema, userIdParamSchema } from '@tracen/contracts';

import type { AppEnv } from '../../env';
import { requireDatabaseUrl } from '../../shared/middleware/require-database-url';
import type { DatabaseUrlEnv } from '../../shared/types/hono';

import { getUserRepository } from './user.repository';
import { createUser, deleteUserById, EmailAlreadyExistsError, getUserById } from './user.usecase';

export function createUserRouter(env: AppEnv): Hono<DatabaseUrlEnv> {
  const router = new Hono<DatabaseUrlEnv>();

  router.use('*', requireDatabaseUrl(env));

  router.get('/:id', zValidator('param', userIdParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const repo = getUserRepository(c.get('databaseUrl'));
    const user = await getUserById(repo, id);

    if (!user) {
      return c.json({ message: 'user not found' }, 404);
    }

    return c.json(user);
  });

  router.delete('/:id', zValidator('param', userIdParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const repo = getUserRepository(c.get('databaseUrl'));
    const deleted = await deleteUserById(repo, id);

    if (!deleted) {
      return c.json({ message: 'user not found' }, 404);
    }

    return c.body(null, 204);
  });

  router.post('/', zValidator('json', createUserSchema), async (c) => {
    const input = c.req.valid('json');
    const repo = getUserRepository(c.get('databaseUrl'));

    try {
      const created = await createUser(repo, input);
      return c.json({ id: created.id }, 201);
    } catch (err) {
      if (err instanceof EmailAlreadyExistsError) {
        return c.json({ message: 'email already exists' }, 409);
      }
      throw err;
    }
  });

  return router;
}
