import { type AuthSignUpRequest, type User, UserSchema } from '@tracen/contracts';
import type { UserRepositorySpec } from '../../../features/users/domain/users.repository';
import { type AuthPassWorkerSpec } from '../../../features/auth/domain/auth.worker';
import { type UserEntity, createUserEntity } from '../../../features/users/domain/users.entity';
import { createUser } from '../../../features/users/domain/users.usecase';
import { ValidationError } from '../../../shared/errors/global.error';
import { ZodError } from 'zod';

export async function registerUser(
  repo: UserRepositorySpec,
  worker: AuthPassWorkerSpec,
  request: AuthSignUpRequest
): Promise<User> {
  try {
    const password_hash = await worker.createHash(request.password);
    const newUser: UserEntity = createUserEntity({
      email: request.email,
      name: request.name,
      password_hash: password_hash,
    });

    const created = await createUser(repo, newUser);
    return UserSchema.parse({
      id: created.id,
      email: created.email,
      name: created.name,
      createdAt: created.createdAt,
    });
  } catch (err) {
    // ドメインエラーのみハンドリング
    if (err instanceof ZodError) {
      throw new ValidationError('Invalid request data');
    }
    // その他のエラーはthrowして、handler側で500エラーとしてハンドリング
    throw err;
  }
}
