import { z } from 'zod';

export const CreateFaceRequestSchema = z
  .object({
    name: z.string().min(1),
    emoji: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.url().optional(),
    isPrivate: z.boolean(),
  })
  .strict();
export type CreateFaceRequest = z.infer<typeof CreateFaceRequestSchema>;

export const UpdateFaceRequestSchema = z
  .object({
    name: z.string().min(1),
    emoji: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.url().optional(),
    isPrivate: z.boolean(),
  })
  .strict();
export type UpdateFaceRequest = z.infer<typeof UpdateFaceRequestSchema>;
