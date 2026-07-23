import { z } from 'zod';
import { SimpleApiResponseSchema } from '../../shared/response';

export const FileDeleteResponseSchema = SimpleApiResponseSchema;
export type FileDeleteResponse = z.infer<typeof FileDeleteResponseSchema>;
