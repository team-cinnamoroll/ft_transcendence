import { z } from 'zod';
import { UserProfileUpsertRequestSchema, UserIdSchema } from '@tracen/contracts';

export const UserProfileEntitySchema = UserProfileUpsertRequestSchema.extend({
  id: z.uuid(),
  userId: UserIdSchema,
});

export type UserProfileEntity = z.infer<typeof UserProfileEntitySchema>;
