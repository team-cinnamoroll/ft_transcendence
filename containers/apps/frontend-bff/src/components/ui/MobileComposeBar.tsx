'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Face } from '@/types/face';
import FaceBadge from '@/components/ui/FaceBadge';
import PostModal from '@/components/ui/PostModal';

type Props = {
  defaultFace?: Face;
};

const MobileComposeBar = ({ defaultFace }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations('mobileComposeBar');

  return (
    <>
      <div
        className="md:hidden fixed left-0 right-0 z-40"
        style={{
          bottom: 73,
          padding: '8px 14px',
          background: 'rgba(248,246,241,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '0.5px solid var(--mf-line)',
        }}
      >
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 14px',
            borderRadius: 14,
            background: 'var(--mf-surface)',
            border: '0.5px solid var(--mf-line)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {defaultFace && <FaceBadge face={defaultFace} size={30} radius={8} />}
          <span
            style={{
              flex: 1,
              fontSize: 14,
              color: 'var(--mf-text-faint)',
              fontFamily: 'var(--mf-font-sans)',
            }}
          >
            {t('placeholder')}
          </span>
          <span
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              background: 'var(--mf-accent)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {t('post')}
          </span>
        </button>
      </div>

      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultFaceId={defaultFace?.id}
      />
    </>
  );
};

export default MobileComposeBar;
