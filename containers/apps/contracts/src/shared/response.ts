import { z } from 'zod';

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(), // success: falseのときのエラーメッセージ
});
