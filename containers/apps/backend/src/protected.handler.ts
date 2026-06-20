import { Hono } from 'hono';
import type { ProtectedEnv } from './shared/types/hono';
import { usersRouter } from './features/users/users.handler';
import { presenceRouter } from './features/presence/presence.handler';

export function protectedRouter() {
  return new Hono<ProtectedEnv>()
    .route('/users', usersRouter())
    .route('/presence', presenceRouter());
}
