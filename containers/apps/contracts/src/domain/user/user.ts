import { z } from 'zod';

import {
  EmailSchema,
  IsoDateTimeStringSchema,
  UuidSchema,
  type Uuid,
} from '../../shared/primitives';

// ユーザーIDのスキーマと型
export const UserIdSchema = UuidSchema;
export type UserId = Uuid;

// ユーザー権限（RBAC）。JWT の role claim と一致させる。
export const UserRoleSchema = z.enum(['admin', 'user']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// 利用制限ステータス。active=通常 / restricted=投稿不可 / suspended=ログイン不可。
export const UserStatusSchema = z.enum(['active', 'restricted', 'suspended']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

// ユーザーデータのレスポンススキーマと型
export const UserResponseSchema = z
  .object({
    id: UserIdSchema,
    email: EmailSchema,
    name: z.string().min(1),
    createdAt: IsoDateTimeStringSchema,
  })
  .strict();
export type UserResponse = z.infer<typeof UserResponseSchema>;
