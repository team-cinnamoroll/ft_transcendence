import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof uuidSchema>;
