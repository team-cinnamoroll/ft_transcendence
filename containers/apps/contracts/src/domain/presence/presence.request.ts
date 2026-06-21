import { z } from 'zod';
import { UserIdSchema } from '../user/user';

export const PresenceUpdateRequestSchema = z.object({});
export type PresenceUpdateRequest = z.infer<typeof PresenceUpdateRequestSchema>;

export const PresenceStatusRequestSchema = z.object({
  userIds: z.array(UserIdSchema), // クライアントから送信されるユーザーIDの配列
});
export type PresenceStatusRequest = z.infer<typeof PresenceStatusRequestSchema>;
