import { type AuthSignInRequest, type User, UserSchema } from '@tracen/contracts';
import type { UserRepositorySpec } from '../../../features/users/domain/users.repository';
import { type AuthPassWorkerSpec } from '../../../features/auth/domain/auth.worker';
import { getUserEntityByEmail } from '../../../features/users/domain/users.usecase';
import { UnauthorizedError } from '../../../shared/errors/global.error';
import { makeSafeUsecaseResult } from '../../../shared/utils/validation';

export async function verifyUser(
  repo: UserRepositorySpec,
  worker: AuthPassWorkerSpec,
  request: AuthSignInRequest
): Promise<User> {
  const user = await getUserEntityByEmail(repo, request.email);
  if (!user) {
    throw new UnauthorizedError('invalid email or password');
  }
  const passwordMatch = await worker.verifyPassword(request.password, user.password_hash);
  if (!passwordMatch) {
    throw new UnauthorizedError('invalid email or password');
  }
  return makeSafeUsecaseResult(UserSchema, {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  });
}
