import { z } from 'zod';
import crypto from 'crypto';
import { UserResponseSchema, UserRoleSchema, UserStatusSchema } from '@tracen/contracts';

// UserEntityのスキーマと型
export const UserEntitySchema = UserResponseSchema.extend({
  password_hash: z.string().min(1),
  // RBAC / 利用制限。新規作成時は既定値（DB の default と一致：role='user' / status='active'）。
  role: UserRoleSchema.default('user'),
  status: UserStatusSchema.default('active'),
}).strict();
export type UserEntity = z.infer<typeof UserEntitySchema>;
// role / status は指定不要（既定値 'user' / 'active' が適用される）。
export const createUserEntity = (
  data: Omit<UserEntity, 'id' | 'createdAt' | 'role' | 'status'>
): UserEntity => {
  return UserEntitySchema.parse({
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
};
