/**
 * タイムゾーン非依存で安全に現在日付や時刻計算を行うユーティリティ。
 * `new Date()` を直接使うとサーバー(UTC)とクライアント(JST等)で日付がズレてしまう問題を解決する。
 */

/**
 * 日本時間(Asia/Tokyo)基準の現在の日付を UTCの0時0分として返す。
 * サーバーでもクライアントでも、全く同じ絶対時刻の Date が得られる。
 */
export function getTodayInJST(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(new Date());
  const y = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const m = parseInt(parts.find((p) => p.type === 'month')!.value, 10) - 1;
  const d = parseInt(parts.find((p) => p.type === 'day')!.value, 10);

  return new Date(Date.UTC(y, m, d));
}

/**
 * 日本時間(Asia/Tokyo)基準での「今月」の文字列 (YYYY-MM) を返す。
 */
export function getCurrentMonthInJST(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value.padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * 日本時間(Asia/Tokyo)基準での「今日」の文字列 (MM-DD) を返す。
 * 主に "On This Day" (過去の今日) を探すために利用する。
 */
export function getCurrentMmDdInJST(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(new Date());
  const m = parts.find((p) => p.type === 'month')!.value.padStart(2, '0');
  const d = parts.find((p) => p.type === 'day')!.value.padStart(2, '0');
  return `${m}-${d}`;
}

/**
 * 日本時間(Asia/Tokyo)基準での「今年」の文字列 (YYYY) を返す。
 */
export function getCurrentYearInJST(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(new Date());
  return parts.find((p) => p.type === 'year')!.value;
}

/**
 * YYYY-MM-DD 形式の文字列を受け取り、その日の日本時間 00:00:00.000 の絶対時刻(timestamp)を返す。
 * `new Date('YYYY-MM-DD')` だとUTCとして解釈されるため、日本時間として正しくオフセットする。
 */
export function parseStartOfDayToUTC(dateString: string): number {
  const [y, m, d] = dateString.split('-').map(Number);
  // 日本時間は UTC+9 なので、日本時間の 0時は UTCの 前日15時
  return Date.UTC(y, m - 1, d, -9, 0, 0, 0);
}

/**
 * YYYY-MM-DD 形式の文字列を受け取り、その日の日本時間 23:59:59.999 の絶対時刻(timestamp)を返す。
 * `new Date('YYYY-MM-DDT23:59:59.999')` だとローカルタイムゾーンの影響を受けるため、
 * 環境依存を排除して計算する。
 */
export function parseEndOfDayToUTC(dateString: string): number {
  const [y, m, d] = dateString.split('-').map(Number);
  // 日本時間は UTC+9 なので、UTCでの時刻は 14:59:59.999 となる
  return Date.UTC(y, m - 1, d, 14, 59, 59, 999);
}
