import { z } from 'zod';

import { FileDeleteRequestSchema, UserIdSchema } from '@tracen/contracts';

export const FileDeleteOperationRequestSchema = FileDeleteRequestSchema.extend({
  clientId: UserIdSchema,
});

export type FileDeleteOperationRequest = z.infer<typeof FileDeleteOperationRequestSchema>;
