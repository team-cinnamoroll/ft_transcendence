import { z } from 'zod';

import { UserIdSchema } from './user';

// 見た目上の文字数（書記素クラスター）を分割するためのセグメンター
const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });

// ユーザーデータのレスポンススキーマと型
export const UserProfileResponseSchema = z
  .object({
    id: UserIdSchema,
    name: z.string().min(1),
    avatarUrl: z.url(),
    badge: z
      .emoji() // 絵文字判定（メッセージは errorMap で i18n）
      .refine((val) => {
        // 見た目上の文字数が1文字であるかを判定
        return [...segmenter.segment(val)].length === 1;
      })
      .optional(), // バッジ絵文字
  })
  .strict();
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
