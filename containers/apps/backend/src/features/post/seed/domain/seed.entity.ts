import { z } from 'zod';
import { SeedSchema, FileMetadataIdSchema, SeedListSchema } from '@tracen/contracts';

export const SeedEntitySchema = SeedSchema.omit({
  images: true,
}).extend({
  imageIds: z.array(FileMetadataIdSchema),
});
export type SeedEntity = z.infer<typeof SeedEntitySchema>;

export const SeedEntityListSchema = SeedListSchema.omit({
  seeds: true,
}).extend({
  seedEntities: z.array(SeedEntitySchema),
});
export type SeedEntityList = z.infer<typeof SeedEntityListSchema>;
