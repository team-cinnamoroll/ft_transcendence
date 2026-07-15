import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const baseMessages = (
    (await import(`./messages/${locale}.json`)) as { default: Record<string, unknown> }
  ).default;
  const termsMessages = (
    (await import(`./messages/terms/${locale}.json`)) as { default: Record<string, unknown> }
  ).default;
  const privacyMessages = (
    (await import(`./messages/privacy/${locale}.json`)) as { default: Record<string, unknown> }
  ).default;

  return {
    locale,
    messages: {
      ...baseMessages,
      Terms: termsMessages,
      Privacy: privacyMessages,
    },
  };
});
