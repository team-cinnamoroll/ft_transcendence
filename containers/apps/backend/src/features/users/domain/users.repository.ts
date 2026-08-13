import type { Email, UserId } from '@tracen/contracts';
import type { UserEntity } from './users.entity';

export type UserRepositorySpec = {
  findById: (id: UserId) => Promise<UserEntity | null>;
  deleteById: (id: UserId) => Promise<boolean>;
  findByEmail: (email: Email) => Promise<UserEntity | null>;
  create: (data: UserEntity) => Promise<UserEntity>;
  update: (data: UserEntity) => Promise<UserEntity>;
};
