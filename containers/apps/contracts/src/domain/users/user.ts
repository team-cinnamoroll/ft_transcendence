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

// ユーザーデータのレスポンススキーマと型
export const UserResponseSchema = z
  .object({
    id: UuidSchema,
    email: EmailSchema,
    name: z.string().min(1),
    createdAt: IsoDateTimeStringSchema,
  })
  .strict();
export type UserResponse = z.infer<typeof UserResponseSchema>;
