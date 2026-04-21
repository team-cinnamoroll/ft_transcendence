import { z } from 'zod';

export const isoDateTimeStringSchema = z.string().datetime();
export type IsoDateTimeString = z.infer<typeof isoDateTimeStringSchema>;
