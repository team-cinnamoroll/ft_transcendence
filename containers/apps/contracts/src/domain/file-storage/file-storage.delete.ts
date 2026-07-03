import { z } from 'zod';
import { SuccessResponseSchema } from '../../shared';

export const FileDeleteResponseSchema = SuccessResponseSchema;
export type FileDeleteResponse = z.infer<typeof FileDeleteResponseSchema>;
