import { z } from 'zod';

import { FileRequestSchema, UserIdSchema } from '@tracen/contracts';

export const FileDeleteOperationRequestSchema = FileRequestSchema.extend({
  clientId: UserIdSchema,
});

export type FileDeleteOperationRequest = z.infer<typeof FileDeleteOperationRequestSchema>;
