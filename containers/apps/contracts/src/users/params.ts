import { z } from 'zod';

import { uuidSchema } from '../shared/primitives/uuid';

export const userIdParamSchema = z.object({
  id: uuidSchema,
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;
