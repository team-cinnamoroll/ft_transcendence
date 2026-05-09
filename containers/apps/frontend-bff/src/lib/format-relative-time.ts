type RelativeTimeMessages = {
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
};

const DEFAULT_MESSAGES_JA: RelativeTimeMessages = {
  justNow: 'たった今',
  minutesAgo: (n) => `${n}分前`,
  hoursAgo: (n) => `${n}時間前`,
  daysAgo: (n) => `${n}日前`,
};

/**
 * ISO 8601 文字列を相対時間表現に変換する。
 * @param isoString - ISO 8601 形式の日付文字列
 * @param locale - 表示ロケール（デフォルト: 'ja'）
 * @param messages - 翻訳メッセージ（省略時は日本語デフォルト）
 */
export const formatRelativeTime = (
  isoString: string,
  locale = 'ja',
  messages: RelativeTimeMessages = DEFAULT_MESSAGES_JA
): string => {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return messages.justNow;
  if (diffMin < 60) return messages.minutesAgo(diffMin);
  if (diffHour < 24) return messages.hoursAgo(diffHour);
  if (diffDay < 30) return messages.daysAgo(diffDay);

  return date.toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'fr' ? 'fr-FR' : 'ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

export type { RelativeTimeMessages };
