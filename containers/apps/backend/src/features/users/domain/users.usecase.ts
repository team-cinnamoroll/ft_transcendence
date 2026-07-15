import { type UserId, type User, UserSchema } from '@tracen/contracts';
import { type UserEntity, UserEntitySchema } from './users.entity';
import type { UserRepositorySpec } from './users.repository';
import { EmailAlreadyExistsError, UserAlreadyExistsError } from './users.error';

export async function createUser(repo: UserRepositorySpec, newUser: UserEntity): Promise<User> {
  const existingUser = await repo.findById(newUser.id);
  if (existingUser) {
    throw new UserAlreadyExistsError();
  }
  const existingEmail = await repo.findByEmail(newUser.email);
  if (existingEmail) {
    throw new EmailAlreadyExistsError();
  }
  const created = await repo.create(newUser);
  return UserSchema.parse({
    id: created.id,
    email: created.email,
    name: created.name,
    createdAt: created.createdAt,
  });
}

export async function getUserById(repo: UserRepositorySpec, id: UserId): Promise<User | null> {
  const user = await repo.findById(id);
  if (!user) {
    return null;
  }
  return UserSchema.parse({
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

export async function deleteUserById(repo: UserRepositorySpec, id: UserId): Promise<boolean> {
  return repo.deleteById(id);
}
