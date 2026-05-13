import { z } from 'zod';
import { UserResponseSchema } from '../user';

export const AuthSignUpResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string().optional(),
    user: UserResponseSchema.optional(),
  })
  .strict();
export type AuthSignUpResponse = z.infer<typeof AuthSignUpResponseSchema>;
