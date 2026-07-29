import { Hono } from 'hono';
import type { ProtectedEnv } from './shared/types/hono';
import { usersRouter } from './features/users/users.handler';
import { presenceRouter } from './features/presence/presence.handler';
import { authSignOutRouter } from './app_services/auth/sign-out/sign-out.handler';
import { fileStorageRouter } from './features/file-storage/file-storage.handler';
import { userProfileRouter } from './features/user-profile/user-profile.handler';
import { friendshipRouter } from './features/friendship/friendship.handler';

export function protectedApiRouter() {
  return new Hono<ProtectedEnv>()
    .route('/users', usersRouter())
    .route('/presence', presenceRouter())
    .route('/auth/sign-out', authSignOutRouter())
    .route('/file-storage', fileStorageRouter())
    .route('/user-profile', userProfileRouter())
    .route('/friendships', friendshipRouter());
}
