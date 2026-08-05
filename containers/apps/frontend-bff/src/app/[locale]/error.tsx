'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errorPage');

  useEffect(() => {
    console.error(error);
  }, [error]);

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
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
          {t('title')}
        </h1>
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
        <button
          onClick={() => reset()}
          style={{
            padding: '12px 0',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            border: 'none',
            background: 'var(--mf-accent)',
            color: '#fff',
            boxShadow: '0 2px 10px rgba(212,146,42,0.25)',
            cursor: 'pointer',
          }}
        >
          {t('retryButton')}
        </button>
      </div>
    </div>
  );
}
