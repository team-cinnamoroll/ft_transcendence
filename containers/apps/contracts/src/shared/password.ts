import { z } from 'zod';

export const UserPasswordSchema = z.string().min(8).max(64);
export type UserPassword = z.infer<typeof UserPasswordSchema>;
