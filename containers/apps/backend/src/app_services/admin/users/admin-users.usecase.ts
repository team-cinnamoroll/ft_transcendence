import { type UserUpdateRequest, type User, type UserId, UserSchema } from '@tracen/contracts';
import type { UserRepositorySpec } from '../../../features/users/domain/users.repository';
import { type AuthPassWorkerSpec } from '../../../features/auth/domain/auth.worker';

import { EmailAlreadyExistsError } from '../../../features/users/domain/users.error';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/global.error';
import { makeSafeUsecaseResult } from '../../../shared/utils/validation';

export async function updateUser(
  repo: UserRepositorySpec,
  worker: AuthPassWorkerSpec,
  userId: UserId,
  request: UserUpdateRequest
): Promise<User> {
  // 存在確認
  const existingUser = await repo.findById(userId);
  if (!existingUser) {
    throw new NotFoundError('User not found');
  }
  // パスワード検証
  const isPasswordValid = await worker.verifyPassword(request.password, existingUser.password_hash);
  if (!isPasswordValid) {
    throw new ForbiddenError('Invalid password');
  }
  // メールアドレスの重複確認
  if (existingUser.email !== request.email) {
    const existingEmail = await repo.findByEmail(request.email);
    if (existingEmail) {
      throw new EmailAlreadyExistsError();
    }
  }
  // パスワードの更新の有無
  let passwordHash = existingUser.password_hash;
  if (request.newPassword) {
    passwordHash = await worker.createHash(request.newPassword);
  }

  const updatedUserEntity = await repo.update({
    id: userId,
    email: request.email,
    name: request.name,
    password_hash: passwordHash,
    createdAt: existingUser.createdAt,
  });
  return makeSafeUsecaseResult(UserSchema, {
    id: updatedUserEntity.id,
    email: updatedUserEntity.email,
    name: updatedUserEntity.name,
    createdAt: updatedUserEntity.createdAt,
  });
}
