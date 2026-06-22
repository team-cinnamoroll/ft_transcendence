import { z } from 'zod';
import { SuccessResponseSchema } from '../../shared';

export const AuthSignOutResponseSchema = SuccessResponseSchema;
export type AuthSignOutResponse = z.infer<typeof AuthSignOutResponseSchema>;
