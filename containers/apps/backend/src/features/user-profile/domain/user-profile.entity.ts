import { z } from 'zod';
import { UserProfileUpsertRequestSchema, UserIdSchema } from '@tracen/contracts';

export const UserProfileIdSchema = z.uuid();

export const UserProfileEntitySchema = UserProfileUpsertRequestSchema.extend({
  id: UserProfileIdSchema,
  userId: UserIdSchema,
});

export type UserProfileEntity = z.infer<typeof UserProfileEntitySchema>;
