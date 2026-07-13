import type { z } from 'zod';

// Zod の検証エラーを i18n メッセージキーに変換する。
// ここでは「キーの決定」だけを行い、翻訳(t())と ICU 変数(min/max)の埋め込みは
// 呼び出し側(frontend-bff の buildZodErrorMap)が担当する。
//
// 対応キー: i18n/messages/*.json の "validation"
//   required / invalid / tooShort {min} / tooLong {max}
//   email.invalid / url.invalid / id.invalid
//   password.tooShort {min} / password.tooLong {max}
//
// 注意: この関数は「Zod のエラーマップ内」で生 issue を渡して使うことを前提とする。
//       生 issue は input を保持しているため、未入力判定(input === undefined)が機能する。

function hasPathSegment(issue: z.core.$ZodRawIssue, segment: string): boolean {
  return issue.path?.some((s) => s === segment) ?? false;
}

export function zodIssueToKey(issue: z.core.$ZodRawIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      return issue.input === undefined ? 'required' : 'invalid';

    case 'too_small': {
      if (hasPathSegment(issue, 'password')) return 'password.tooShort';
      if (Number(issue.minimum) <= 1) return 'required';
      return 'tooShort';
    }

    case 'too_big':
      return hasPathSegment(issue, 'password') ? 'password.tooLong' : 'tooLong';

    case 'invalid_format':
      if (issue.format === 'email') return 'email.invalid';
      if (issue.format === 'url') return 'url.invalid';
      if (issue.format === 'emoji') return 'badge.invalid';
      if (issue.format === 'uuid') return 'id.invalid';
      return 'invalid';

    case 'custom':
      if (hasPathSegment(issue, 'badge')) return 'badge.single';
      return 'invalid';

    default:
      return 'invalid';
  }
}
