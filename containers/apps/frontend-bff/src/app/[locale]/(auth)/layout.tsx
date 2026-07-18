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
          flexDirection: 'column', // ← 横並び→縦積みに
          alignItems: 'center', // ← 各行を中央寄せ
          gap: 8, // ← 行間（flexWrap の gap は不要に）
          padding: '20px 16px',
          borderTop: '0.5px solid var(--mf-line)',
          fontSize: 12,
        }}
      >
        <nav style={{ display: 'flex', gap: 20 }}>
          <Link href="/terms" style={linkStyle}>
            {t('terms')}
          </Link>
          <Link href="/privacy" style={linkStyle}>
            {t('privacy')}
          </Link>
        </nav>
        <span style={{ color: 'var(--mf-text-muted)' }}>{t('copyright', { year: 2026 })}</span>
      </footer>
    </div>
  );
}
