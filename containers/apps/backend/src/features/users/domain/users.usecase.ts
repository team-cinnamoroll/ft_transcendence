import {
  type CreateUserRequest,
  type UserId,
  type UserResponse,
  UserResponseSchema,
  createUserEntity,
} from './users.entity';
import type { UserRepositorySpec } from './users.repository';

export class EmailAlreadyExistsError extends Error {
  override name = 'EmailAlreadyExistsError';

  constructor() {
    super('email already exists');
  }
}

export async function createUser(
  repo: UserRepositorySpec,
  request: CreateUserRequest
): Promise<UserResponse> {
  const existing = await repo.findByEmail(request.email);
  if (existing) {
    throw new EmailAlreadyExistsError();
  }
  const password_hash = request.password;
  const newUser = createUserEntity({
    email: request.email,
    name: request.name,
    password_hash: password_hash,
  });
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

export async function deleteUserById(repo: UserRepositorySpec, id: UserId): Promise<boolean> {
  return repo.deleteById(id);
}
