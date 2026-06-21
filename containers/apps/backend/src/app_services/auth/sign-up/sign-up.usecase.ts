import {
  type AuthSignUpRequest,
  type AuthSignUpResponse,
  AuthSignUpResponseSchema,
  UserResponseSchema,
} from '@tracen/contracts';
import type { UserRepositorySpec } from '../../../features/users/domain/users.repository';
import { type AuthPassWorkerSpec } from '../../../features/auth/domain/auth.worker';
import { createUserEntity } from '../../../features/users/domain/users.entity';
import { createUser } from '../../../features/users/domain/users.usecase';
import {
  EmailAlreadyExistsError,
  UserAlreadyExistsError,
} from '../../../features/users/domain/users.error';
import { ZodError } from 'zod';

export async function signUp(
  repo: UserRepositorySpec,
  worker: AuthPassWorkerSpec,
  request: AuthSignUpRequest
): Promise<AuthSignUpResponse> {
  const password_hash = await worker.createHash(request.password);
  const newUser = createUserEntity({
    email: request.email,
    name: request.name,
    password_hash: password_hash,
  });
  try {
    const created = await createUser(repo, newUser);
    return AuthSignUpResponseSchema.parse({
      success: true,
      message: undefined,
      user: UserResponseSchema.parse({
        id: created.id,
        email: created.email,
        name: created.name,
        createdAt: created.createdAt,
      }),
    });
  } catch (err) {
    // ドメインエラーのみハンドリング
    if (err instanceof EmailAlreadyExistsError) {
      return AuthSignUpResponseSchema.parse({
        success: false,
        message: 'email already registered',
        user: undefined,
      });
    }
    if (err instanceof UserAlreadyExistsError) {
      return AuthSignUpResponseSchema.parse({
        success: false,
        message: 'user already exists',
        user: undefined,
      });
    }
    if (err instanceof ZodError) {
      return AuthSignUpResponseSchema.parse({
        success: false,
        message: 'invalid request data',
        user: undefined,
      });
    }
    // その他のエラーはthrowして、handler側で500エラーとしてハンドリング
    throw err;
  }
}
