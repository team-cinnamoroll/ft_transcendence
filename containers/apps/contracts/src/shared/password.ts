import { z } from 'zod';

export const UserPasswordSchema = z
  .string()
  .min(8, '8文字以上必要です')
  .max(64, 'パスワードが長すぎます');
