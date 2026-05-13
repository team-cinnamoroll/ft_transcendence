import { z } from 'zod';
import crypto from 'crypto';
import { UserResponseSchema } from '@tracen/contracts';

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
