import { z } from 'zod';
import { UserResponseSchema } from '@tracen/contracts';
import type { Email, UserId } from '@tracen/contracts';

export type { UserId, UserResponse } from '@tracen/contracts';
export { UserResponseSchema } from '@tracen/contracts';

// UserEntityのスキーマと型
export const UserEntitySchema = UserResponseSchema.extend({
  password_hash: z.string().min(1),
}).strict();
export type UserEntity = z.infer<typeof UserEntitySchema>;
export const createUserEntity = (data: Omit<UserEntity, 'id' | 'createdAt'>): UserEntity => {
  return UserEntitySchema.parse({
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
};

export type UserRepositorySpec = {
  findById: (id: UserId) => Promise<UserEntity | null>;
  deleteById: (id: UserId) => Promise<boolean>;
  findByEmail: (email: Email) => Promise<UserEntity | null>;
  create: (data: UserEntity) => Promise<UserEntity>;
};
