import { Hono } from 'hono';
import type { ProtectedEnv } from './shared/types/hono';
import { injectJwtAuthDeps } from './shared/middleware/inject-jwk-auth';
import { jwtRateLimiter } from './shared/middleware/jwt-rate-limiter';
import { selectiveApiProtection } from './shared/middleware/api-key-auth';

import { usersRouter } from './features/users/users.handler';
import { presenceRouter } from './features/presence/presence.handler';
import { authSignOutRouter } from './app_services/auth/sign-out/sign-out.handler';
import { fileStorageRouter } from './features/file-storage/file-storage.handler';
import { userProfileRouter } from './features/user-profile/user-profile.handler';
import { friendshipRouter } from './features/friendship/friendship.handler';
import { faceRouter } from './features/post/face/face.handler';
import { seedRouter } from './features/post/seed/seed.handler';

import { authRouter } from './app_services/auth/auth.handler';
import { adminUsersRouter } from './app_services/admin/users/admin-users.handler';

export function jwtProtectedRouter() {
  return new Hono<ProtectedEnv>()
    .use('*', injectJwtAuthDeps())
    .use('*', jwtRateLimiter)
    .route('/users', usersRouter())
    .route('/presence', presenceRouter())
    .route('/auth/sign-out', authSignOutRouter())
    .route('/file-storage', fileStorageRouter())
    .route('/user-profile', userProfileRouter())
    .route('/friendships', friendshipRouter())
    .route('/faces', faceRouter())
    .route('/seeds', seedRouter());
}

export function apiKeyProtectedRouter() {
  return new Hono<ProtectedEnv>()
    .use('*', selectiveApiProtection) // APIキー認証が必要なルートを保護
    .route('/auth', authRouter())
    .route('/admin/users', adminUsersRouter());
}
