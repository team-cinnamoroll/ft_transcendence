import {
  type SignUpRequest,
  type AuthSignUpResponse,
  AuthSignUpResponseSchema,
  UserResponseSchema,
} from '@tracen/contracts';
import type { UserRepositorySpec } from '../../../features/users/domain/users.repository';
import { type AuthPassWorkerSpec } from '../../../features/auth/domain/auth.worker';
import { createUserEntity } from '../../../features/users/domain/users.entity';
import { createUser } from '../../../features/users/domain/users.usecase';

export async function signUp(
  repo: UserRepositorySpec,
  worker: AuthPassWorkerSpec,
  request: SignUpRequest
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
    return AuthSignUpResponseSchema.parse({
      success: false,
      message: err instanceof Error ? err.message : 'unknown error',
      user: undefined,
    });
  }
}
