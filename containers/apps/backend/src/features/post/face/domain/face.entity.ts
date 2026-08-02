import { z } from 'zod';
import {
  FaceSchema,
  FileMetadataIdSchema,
  FaceSummarySchema,
  FaceSummaryListSchema,
} from '@tracen/contracts';

export const FaceEntitySchema = FaceSchema.omit({
  image: true,
}).extend({
  imageId: FileMetadataIdSchema.nullable(),
});
export type FaceEntity = z.infer<typeof FaceEntitySchema>;

export const FaceEntitySummarySchema = FaceSummarySchema.omit({
  face: true,
}).extend({
  faceEntity: FaceEntitySchema,
});
export type FaceEntitySummary = z.infer<typeof FaceEntitySummarySchema>;

export const FaceEntitySummaryListSchema = FaceSummaryListSchema.omit({
  faceSummaries: true,
}).extend({
  faceEntitySummaries: z.array(FaceEntitySummarySchema),
});
export type FaceEntitySummaryList = z.infer<typeof FaceEntitySummaryListSchema>;
