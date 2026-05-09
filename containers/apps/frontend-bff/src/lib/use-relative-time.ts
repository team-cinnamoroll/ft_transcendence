'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatRelativeTime, type RelativeTimeMessages } from './format-relative-time';

/**
 * ISO 8601 文字列をロケールに応じた相対時間表現へ変換するフック。
 */
export const useRelativeTime = () => {
  const locale = useLocale();
  const t = useTranslations('relativeTime');

  const messages: RelativeTimeMessages = {
    justNow: t('justNow'),
    minutesAgo: (n) => t('minutesAgo', { n }),
    hoursAgo: (n) => t('hoursAgo', { n }),
    daysAgo: (n) => t('daysAgo', { n }),
  };

  return (isoString: string) => formatRelativeTime(isoString, locale, messages);
};
