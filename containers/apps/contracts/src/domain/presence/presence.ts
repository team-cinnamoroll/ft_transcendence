import { z } from 'zod';
import { SimpleApiResponseSchema, createApiResponseSchema } from '../../shared/response';
import { UserIdSchema } from '../user/user';
import { IsOnlineSchema } from '../../shared/primitives';

export const PresenceUpdateResponseSchema = SimpleApiResponseSchema;
export type PresenceUpdateResponse = z.infer<typeof PresenceUpdateResponseSchema>;

const PresenceStatusDataSchema = z
  .object({
    onlineStatuses: z.record(UserIdSchema, IsOnlineSchema), // ユーザーIDをキー、オンライン状態を値とするオブジェクト
  })
  .strict();

export const PresenceStatusResponseSchema = createApiResponseSchema(PresenceStatusDataSchema);
export type PresenceStatusResponse = z.infer<typeof PresenceStatusResponseSchema>;
