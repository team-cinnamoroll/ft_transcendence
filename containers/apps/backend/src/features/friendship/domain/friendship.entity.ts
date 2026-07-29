import { z } from 'zod';
import { FriendshipCreateRequestSchema, UserIdSchema } from '@tracen/contracts';

export const FriendshipEntityCreateRequestSchema = FriendshipCreateRequestSchema.extend({
  requesterId: UserIdSchema,
});
export type FriendshipEntityCreateRequest = z.infer<typeof FriendshipEntityCreateRequestSchema>;
