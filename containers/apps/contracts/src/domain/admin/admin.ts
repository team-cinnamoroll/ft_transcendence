import { z } from 'zod';

import { EmailSchema, IsoDateTimeStringSchema } from '../../shared/primitives';
import { UserIdSchema, UserRoleSchema, UserStatusSchema } from '../user/user';

// admin から見たユーザー1件（role / status を含む管理ビュー）
export const AdminUserResponseSchema = z
  .object({
    id: UserIdSchema,
    email: EmailSchema,
    name: z.string().min(1),
    role: UserRoleSchema,
    status: UserStatusSchema,
    createdAt: IsoDateTimeStringSchema,
  })
  .strict();
export type AdminUserResponse = z.infer<typeof AdminUserResponseSchema>;

// admin ユーザー一覧
export const AdminUserListResponseSchema = z
  .object({
    users: z.array(AdminUserResponseSchema),
  })
  .strict();
export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;
