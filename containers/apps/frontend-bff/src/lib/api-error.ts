/**
 * backend が返す HTTP ステータスコードの意味（セマンティクス）を分類する。
 * ビジネス上の意味（例: 409 は「メール重複」か「名前重複」か）はここでは扱わない。
 * その区別は呼び出し元（Server Actions など）が ApiErrorKind + 文脈から行う。
 */
export type ApiErrorKind =
  | 'VALIDATION' // 400
  | 'UNAUTHORIZED' // 401
  | 'FORBIDDEN' // 403
  | 'NOT_FOUND' // 404
  | 'CONFLICT' // 409
  | 'SERVER_ERROR' // 500
  | 'UNKNOWN'; // 上記に当てはまらないステータス

export function classifyHttpStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'VALIDATION';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 500:
      return 'SERVER_ERROR';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Repository / Usecase 層が backend 呼び出しの結果を表現するための汎用Result型。
 * `server/actions/result.ts` の `ActionResult<T>` と同じ発想で、
 * 「成功時はdata、失敗時はerrorKind」というResult型を共通化したもの。
 */
export type ApiResult<T> = { success: true; data: T } | { success: false; errorKind: ApiErrorKind };
