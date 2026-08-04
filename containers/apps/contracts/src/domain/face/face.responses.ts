import { z } from 'zod';
import { FaceSchema, FaceIdSchema } from './face';
import { createApiResponseSchema } from '../../shared/response';
import { IsoDateTimeStringSchema } from '../../shared/primitives';

// CREATE
export const FaceCreateResponseSchema = createApiResponseSchema(z.object({ face: FaceSchema }));
export type FaceCreateResponse = z.infer<typeof FaceCreateResponseSchema>;

// UPDATE
export const FaceUpdateResponseSchema = createApiResponseSchema(z.object({ face: FaceSchema }));
export type FaceUpdateResponse = z.infer<typeof FaceUpdateResponseSchema>;

// DELETE は204 No Contentを返すので、レスポンスボディはなし

// GET
export const FaceSummarySchema = z.object({
  face: FaceSchema,
  lastPostedAt: IsoDateTimeStringSchema.nullable(),
  numberOfPosts: z.number().int().nonnegative(),
});
export type FaceSummary = z.infer<typeof FaceSummarySchema>;

export const FaceSummaryListSchema = z.object({
  faceSummaries: z.array(FaceSummarySchema),
  nextCursor: FaceIdSchema.nullable(),
});
export type FaceSummaryList = z.infer<typeof FaceSummaryListSchema>;

export const FaceListResponseSchema = createApiResponseSchema(
  z.object({ faces: FaceSummaryListSchema })
);
export type FaceListResponse = z.infer<typeof FaceListResponseSchema>;
