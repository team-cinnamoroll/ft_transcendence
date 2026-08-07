import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const LandingPage = async () => {
  const t = await getTranslations('landing');

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--mf-accent)', margin: 0 }}>
          {t('tagline')}
        </p>
        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.7,
            color: 'var(--mf-text-muted)',
            margin: 0,
          }}
        >
          {t('description')}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: 12,
          }}
        >
          <Link
            href="/sign-up"
            style={{
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              background: 'var(--mf-accent)',
              color: '#fff',
              boxShadow: '0 2px 10px rgba(212,146,42,0.25)',
              textDecoration: 'none',
            }}
          >
            {t('signUpButton')}
          </Link>
          <Link
            href="/sign-in"
            style={{
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              border: '0.5px solid var(--mf-line)',
              background: 'var(--mf-surface)',
              color: 'var(--mf-brand)',
              textDecoration: 'none',
            }}
          >
            {t('signInButton')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
