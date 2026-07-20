'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '@/types/user-profile';

type Props = {
  user: UserProfile;
  onClose: () => void;
};

const ProfileEditModal = ({ user, onClose }: Props) => {
  const t = useTranslations('profileEditModal');
  const [name, setName] = useState(user.name);
  const [badge, setBadge] = useState(user.badge ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: 12,
    border: '0.5px solid var(--mf-line)',
    background: 'var(--mf-surface)',
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--mf-ink)',
    fontFamily: 'var(--mf-font-sans)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(20,24,36,0.50)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('ariaLabel')}
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
          width: 'calc(100% - 2rem)',
          maxWidth: 400,
          borderRadius: 18,
          background: 'var(--mf-bg-light)',
          border: '0.5px solid var(--mf-line)',
          boxShadow: '0 20px 60px rgba(30,42,74,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px 12px',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
            {t('title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            style={{
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mf-text-muted)',
            }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 18px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label
              htmlFor="profile-name"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('name')}
              <span style={{ marginLeft: 4, color: 'var(--mf-accent)' }}>{t('required')}</span>
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label
              htmlFor="profile-badge"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('badge')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <input
              id="profile-badge"
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder={t('badgePlaceholder')}
              style={inputStyle}
            />
            <span style={{ fontSize: 11, color: 'var(--mf-text-muted)' }}>{t('badgeHint')}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label
              htmlFor="profile-avatar"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('avatar')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <input
              id="profile-avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder={t('avatarPlaceholder')}
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            disabled
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'not-allowed',
              background: 'var(--mf-surface-tint)',
              color: 'var(--mf-text-faint)',
              boxShadow: 'none',
            }}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileEditModal;
