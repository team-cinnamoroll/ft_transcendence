'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const BackButton = () => {
  const router = useRouter();
  const t = useTranslations('seedDetail');

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label={t('backAriaLabel')}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--mf-brand)',
      }}
    >
      <svg
        width={20}
        height={20}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 4l-6 6 6 6" />
      </svg>
    </button>
  );
};

export default BackButton;
