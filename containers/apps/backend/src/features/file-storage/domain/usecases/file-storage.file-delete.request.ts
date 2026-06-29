import { z } from 'zod';

import {
  FileDeleteRequestSchema as FileDeleteRequestApiSchema,
  UserIdSchema,
} from '@tracen/contracts';

export const FileDeleteRequestSchema = FileDeleteRequestApiSchema.extend({
  clientId: UserIdSchema,
});

export type FileDeleteRequest = z.infer<typeof FileDeleteRequestSchema>;
