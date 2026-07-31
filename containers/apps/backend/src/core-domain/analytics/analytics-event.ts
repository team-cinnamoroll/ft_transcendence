import { z } from 'zod';

export const AuthActionSchema = z.enum(['login', 'logout', 'signup']);
export type AuthAction = z.infer<typeof AuthActionSchema>;

export const PostActionSchema = z.enum(['created']);
export type PostAction = z.infer<typeof PostActionSchema>;
