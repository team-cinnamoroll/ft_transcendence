import { z } from 'zod';
import { SeedSchema, SeedIdSchema } from './seed';
import { createApiResponseSchema } from '../../shared/response';

// CREATE
export const SeedCreateResponseSchema = createApiResponseSchema(z.object({ seed: SeedSchema }));
export type SeedCreateResponse = z.infer<typeof SeedCreateResponseSchema>;

// UPDATE
export const SeedUpdateResponseSchema = createApiResponseSchema();
export type SeedUpdateResponse = z.infer<typeof SeedUpdateResponseSchema>;

// DELETE は204 No Contentを返すので、レスポンスボディはなし

// GET
export const SeedListSchema = z.object({
  seeds: z.array(SeedSchema),
  nextCursor: SeedIdSchema.nullable(),
});
export type SeedList = z.infer<typeof SeedListSchema>;

export const SeedListResponseSchema = createApiResponseSchema(z.object({ seeds: SeedListSchema }));
export type SeedListResponse = z.infer<typeof SeedListResponseSchema>;
