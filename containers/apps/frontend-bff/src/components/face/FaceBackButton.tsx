'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const FaceBackButton = () => {
  const router = useRouter();
  const t = useTranslations('faceDetailPage');

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label={t('backAriaLabel')}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--mf-text-muted)',
        flexShrink: 0,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
};

export default FaceBackButton;
