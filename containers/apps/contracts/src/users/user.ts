import { z } from 'zod';

import { emailSchema } from '../shared/primitives/email';
import { isoDateTimeStringSchema } from '../shared/primitives/iso-datetime';
import { uuidSchema } from '../shared/primitives/uuid';

export const userSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  name: z.string().min(1),
  createdAt: isoDateTimeStringSchema,
});

export type User = z.infer<typeof userSchema>;
