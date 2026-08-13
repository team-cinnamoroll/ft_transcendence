/**
 * スクリプト実行日を基準に、日付をISO文字列として生成するヘルパー。
 * モックデータの createdAt はここを経由してのみ生成する(絶対日付をハードコードしない)。
 */

/** n日前の日時をISO文字列で返す。時刻を省略した場合はランダムな夜間の時刻(19-23時台)を使う */
export function daysAgo(n: number, hour?: number, minute?: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(
    hour ?? 19 + Math.floor(Math.random() * 5),
    minute ?? Math.floor(Math.random() * 60),
    0,
    0
  );
  return d.toISOString();
}

/** ちょうどn年前の「今日」の日時をISO文字列で返す(「1年前の今日」機能の検証用) */
export function yearsAgo(n: number, hour?: number, minute?: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  d.setHours(
    hour ?? 19 + Math.floor(Math.random() * 5),
    minute ?? Math.floor(Math.random() * 60),
    0,
    0
  );
  return d.toISOString();
}
