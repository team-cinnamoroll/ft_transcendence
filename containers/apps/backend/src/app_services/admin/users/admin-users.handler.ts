import { Hono } from 'hono';
import { customZValidator as cZValidator } from '../../../shared/utils/custom-z-validator';

import { getUserById, deleteUserById } from '../../../features/users/domain/users.usecase';
import { updateUser } from './admin-users.usecase';
import {
  UserIdParamSchema,
  UserUpdateRequestSchema,
  UserUpdateResponseSchema,
  UserSingleIdResponseSchema,
} from '@tracen/contracts';
import { injectUsersDeps } from '../../../features/users/users.di';
import { injectAuthWorkerDeps } from '../../../features/auth/infra/auth.worker.di';
import { makeSafeResponse } from '../../../shared/utils/validation';
import { EmailAlreadyExistsError } from '../../../features/users/domain/users.error';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/global.error';

export function adminUsersRouter() {
  return new Hono()
    .use('*', injectUsersDeps())
    .get('/:id', cZValidator('param', UserIdParamSchema), async (c) => {
      const { id } = c.req.valid('param');
      const userRepo = c.get('userRepo');

      try {
        const user = await getUserById(userRepo, id);
        if (!user) {
          return c.json(
            makeSafeResponse(UserSingleIdResponseSchema, {
              success: false,
              message: 'User not found',
            }),
            404
          );
        }
        return c.json(
          makeSafeResponse(UserSingleIdResponseSchema, {
            success: true,
            data: { user },
          })
        );
      } catch (error) {
        console.error('Error occurred while retrieving user:', error);
        throw error; // グローバルエラーハンドラで処理
      }
    })
    .delete('/:id', cZValidator('param', UserIdParamSchema), async (c) => {
      const { id } = c.req.valid('param');
      const userRepo = c.get('userRepo');
      try {
        const deleted = await deleteUserById(userRepo, id);
        if (!deleted) {
          return c.json(
            makeSafeResponse(UserSingleIdResponseSchema, {
              success: false,
              message: 'user not found',
            }),
            404
          );
        }
        return c.body(null, 204);
      } catch (err) {
        console.error('Error during user deletion:', err);
        throw err; // グローバルエラーハンドラで処理
      }
    })
    .use('*', injectAuthWorkerDeps())
    .put(
      '/:id',
      cZValidator('param', UserIdParamSchema),
      cZValidator('json', UserUpdateRequestSchema),
      async (c) => {
        const { id } = c.req.valid('param');
        const updateData = c.req.valid('json');
        const userRepo = c.get('userRepo');
        const authPassWorker = c.get('authPassWorker');
        try {
          const updatedUser = await updateUser(userRepo, authPassWorker, id, updateData);
          return c.json(
            makeSafeResponse(UserUpdateResponseSchema, {
              success: true,
              data: { user: updatedUser },
            })
          );
        } catch (error) {
          console.error('Error occurred while updating user:', error);
          if (error instanceof EmailAlreadyExistsError) {
            return c.json(
              makeSafeResponse(UserUpdateResponseSchema, {
                success: false,
                message: 'Email already exists',
              }),
              409
            );
          }
          if (error instanceof NotFoundError) {
            return c.json(
              makeSafeResponse(UserUpdateResponseSchema, {
                success: false,
                message: 'User not found',
              }),
              404
            );
          }
          if (error instanceof ForbiddenError) {
            return c.json(
              makeSafeResponse(UserUpdateResponseSchema, {
                success: false,
                message: 'Forbidden: You can only update your own account',
              }),
              403
            );
          }
          throw error; // グローバルエラーハンドラで処理
        }
      }
    );
}
