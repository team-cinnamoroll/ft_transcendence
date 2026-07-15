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

export const UserNameSchema = z.string().min(1).max(100);
export type UserName = z.infer<typeof UserNameSchema>;

// ユーザーデータのレスポンススキーマと型
export const UserSchema = z
  .object({
    id: UserIdSchema,
    email: EmailSchema,
    name: UserNameSchema,
    createdAt: IsoDateTimeStringSchema,
  })
  .strict();
export type User = z.infer<typeof UserSchema>;
