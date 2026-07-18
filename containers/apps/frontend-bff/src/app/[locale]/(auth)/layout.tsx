import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('legal');
  const linkStyle = { color: 'var(--mf-text-sub)', textDecoration: 'none' } as const;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>{children}</div>
      <footer
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          padding: '20px 16px',
          fontSize: 12,
          color: 'var(--mf-text-muted)',
          borderTop: '0.5px solid var(--mf-line)',
        }}
      >
        <Link href="/terms" style={linkStyle}>
          {t('terms')}
        </Link>
        <Link href="/privacy" style={linkStyle}>
          {t('privacy')}
        </Link>
      </footer>
    </div>
  );
}
