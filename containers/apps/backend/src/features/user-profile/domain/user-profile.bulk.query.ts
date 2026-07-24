import { z } from 'zod';
import { UserIdSchema } from '@tracen/contracts';

export const UserProfileBulkQuerySchema = z.object({
  ids: z
    .string()
    .transform((val, ctx) => {
      // "usr_1, usr_2, " のような文字列をカンマ分割 & 余計な空白除去 & 空文字列除去
      const splitIds = val
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (splitIds.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'one or more user IDs must be provided',
        });
        return z.NEVER; // 中断処理
      }
      return splitIds;
    })
    .pipe(
      // 変換後の string[] に対してバリデーション
      z
        .array(UserIdSchema)
        .min(1, 'one or more user IDs must be provided')
        .max(100, 'a maximum of 100 user IDs can be provided at once')
    ),
});

export type UserProfileBulkQuery = z.infer<typeof UserProfileBulkQuerySchema>;
