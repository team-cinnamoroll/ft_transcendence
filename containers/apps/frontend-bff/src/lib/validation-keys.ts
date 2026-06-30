import type { z } from 'zod';

// Zod の検証エラーを i18n メッセージキーに変換する。
// ここでは「キーの決定」だけを行い、翻訳(t())と ICU 変数(min/max)の埋め込みは
// 呼び出し側(frontend-bff の buildZodErrorMap)が担当する。
//
// 対応キー: i18n/messages/*.json の "validation"
//   required / invalid / tooShort {min} / tooLong {max}
//   email.invalid / url.invalid
//   password.tooShort {min} / password.tooLong {max}
//
// 注意: この関数は「Zod のエラーマップ内」で生 issue を渡して使うことを前提とする。
//       生 issue は input を保持しているため、未入力判定(input === undefined)が機能する。

// UserPasswordSchema を使うフィールド名は 'password'(sign-up / sign-in)。
function isPasswordIssue(issue: z.core.$ZodIssue): boolean {
  return issue.path.some((segment) => segment === 'password');
}

export function zodIssueToKey(issue: z.core.$ZodIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      return issue.input === undefined ? 'required' : 'invalid';

    case 'too_small': {
      if (isPasswordIssue(issue)) return 'password.tooShort';
      if (Number(issue.minimum) <= 1) return 'required';
      return 'tooShort';
    }

    case 'too_big':
      return isPasswordIssue(issue) ? 'password.tooLong' : 'tooLong';

    case 'invalid_format':
      if (issue.format === 'email') return 'email.invalid';
      if (issue.format === 'url') return 'url.invalid';
      if (issue.format === 'emoji') return 'badge.invalid';
      return 'invalid';

    case 'custom':
      if (issue.path.some((seg) => seg === 'badge')) return 'badge.single';
      return 'invalid';

    default:
      return 'invalid';
  }
}
