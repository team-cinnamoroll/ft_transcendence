import { z } from 'zod';

import { emailSchema } from '../shared/primitives/email';

export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
