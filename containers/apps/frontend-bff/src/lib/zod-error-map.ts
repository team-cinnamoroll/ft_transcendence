import type { z } from 'zod';
import { zodIssueToKey } from './validation-keys';

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

/**
 * Zod の検証エラーを、ロケール対応メッセージへ変換する errorMap を組み立てる。
 *
 * 役割分担:
 *  - キーの決定はi18n非依存な zodIssueToKey で行う
 *  - ICU 変数の埋め込みはここでする:
 *      tooShort / password.tooShort → {min} (too_small.minimum)
 *      tooLong  / password.tooLong  → {max} (too_big.maximum)
 *
 * 使い方:
 *   schema.safeParse(value, { error: buildZodErrorMap(t) })
 *   もしくは z.config({ customError: buildZodErrorMap(t) })
 */
export function buildZodErrorMap(t: TranslateFn): z.core.$ZodErrorMap {
  return (issue) => {
    const key = zodIssueToKey(issue);
    const values: Record<string, number> = {};

    if (issue.code === 'too_small') {
      values.min = Number(issue.minimum);
    } else if (issue.code === 'too_big') {
      values.max = Number(issue.maximum);
    }

    return t(key, values);
  };
}

export type { TranslateFn };
