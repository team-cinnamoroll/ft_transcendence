import { z } from 'zod';
import { UserSchema } from '@tracen/contracts';

// UserEntityのスキーマと型
export const UserEntitySchema = UserSchema.extend({
  password_hash: z.string().min(1),
}).strict();
export type UserEntity = z.infer<typeof UserEntitySchema>;
