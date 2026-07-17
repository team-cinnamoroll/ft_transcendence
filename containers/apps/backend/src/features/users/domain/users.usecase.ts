import { type UserId, type UserResponse, UserResponseSchema } from '@tracen/contracts';
import { type UserEntity, UserEntitySchema } from './users.entity';
import type { UserRepositorySpec } from './users.repository';
import { EmailAlreadyExistsError, UserAlreadyExistsError } from './users.error';

export async function createUser(
  repo: UserRepositorySpec,
  newUser: UserEntity
): Promise<UserResponse> {
  const existingUser = await repo.findById(newUser.id);
  if (existingUser) {
    throw new UserAlreadyExistsError();
  }
  const existingEmail = await repo.findByEmail(newUser.email);
  if (existingEmail) {
    throw new EmailAlreadyExistsError();
  }
  const created = await repo.create(newUser);
  return UserResponseSchema.parse({
    id: created.id,
    email: created.email,
    name: created.name,
    createdAt: created.createdAt,
  });
}

export async function getUserResponseById(
  repo: UserRepositorySpec,
  id: UserId
): Promise<UserResponse | null> {
  const user = await repo.findById(id);
  if (!user) {
    return null;
  }
  return UserResponseSchema.parse({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  });
}

export async function getUserEntityByEmail(
  repo: UserRepositorySpec,
  email: string
): Promise<UserEntity | null> {
  const user = await repo.findByEmail(email);
  if (!user) {
    return null;
  }
  return UserEntitySchema.parse(user);
}

// role / status を含むユーザー実体を ID で取得（トークン発行・認可判定で使用）
export async function getUserEntityById(
  repo: UserRepositorySpec,
  id: UserId
): Promise<UserEntity | null> {
  const user = await repo.findById(id);
  if (!user) {
    return null;
  }
  return UserEntitySchema.parse(user);
}

export async function deleteUserById(repo: UserRepositorySpec, id: UserId): Promise<boolean> {
  return repo.deleteById(id);
}
