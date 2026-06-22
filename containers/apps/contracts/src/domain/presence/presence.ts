import { z } from 'zod';
import { SuccessResponseSchema } from '../../shared/response';

export const PresenceUpdateResponseSchema = SuccessResponseSchema;
export type PresenceUpdateResponse = z.infer<typeof PresenceUpdateResponseSchema>;

export const PresenceStatusResponseSchema = SuccessResponseSchema.extend({
  onlineStatuses: z.record(z.string(), z.boolean()), // ユーザーIDをキー、オンライン状態を値とするオブジェクト
});
export type PresenceStatusResponse = z.infer<typeof PresenceStatusResponseSchema>;
