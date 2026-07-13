'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  border: '0.5px solid var(--mf-line)',
  background: 'var(--mf-surface)',
  color: 'var(--mf-text)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const LanguageSwitcher = () => {
  const t = useTranslations('settings');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <select
      aria-label={t('language.title')}
      value={locale}
      onChange={(e) =>
        router.replace(pathname, { locale: e.target.value as (typeof routing.locales)[number] })
      }
      style={selectStyle}
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc}>
          {t(`language.${loc}`)}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;
