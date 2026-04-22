import type { CreateUserInput, User, UserId } from './user.entity';
import type { UserRepositorySpec } from './user.repository';

export class EmailAlreadyExistsError extends Error {
  override name = 'EmailAlreadyExistsError';

  constructor() {
    super('email already exists');
  }
}

export async function createUser(repo: UserRepositorySpec, input: CreateUserInput): Promise<User> {
  const existing = await repo.findByEmail(input.email);
  if (existing) {
    throw new EmailAlreadyExistsError();
  }

  return repo.create(input);
}

export async function getUserById(repo: UserRepositorySpec, id: UserId): Promise<User | null> {
  return repo.findById(id);
}

export async function deleteUserById(repo: UserRepositorySpec, id: UserId): Promise<boolean> {
  return repo.deleteById(id);
}
