'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { UserProfileUpsertRequestSchema } from '@tracen/contracts';
import type { UserProfile, UserProfileUpsertRequest } from '@/types/user-profile';
import { updateUserProfileAction } from '@/server/actions/user-profile';
import { buildZodErrorMap } from '@/lib/zod-error-map';

type Props = {
  user: UserProfile;
  onClose: () => void;
};

type ProfileFormFields = Pick<UserProfileUpsertRequest, 'name' | 'badge'>;

const profileFormSchema = UserProfileUpsertRequestSchema.pick({ name: true, badge: true });

const ProfileEditModal = ({ user, onClose }: Props) => {
  const t = useTranslations('profileEditModal');
  const tValidation = useTranslations('validation');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormFields>({
    resolver: zodResolver(profileFormSchema, { error: buildZodErrorMap(tValidation) }),
    defaultValues: { name: user.name, badge: user.badge },
  });

  const onValid = (data: ProfileFormFields) => {
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await updateUserProfileAction(data);

      if (!result.success) {
        const firstFieldError = Object.values(result.errors)[0]?.[0];
        setError(firstFieldError ?? t('errorGeneric'));
        return;
      }
      if (!result.data.success) {
        setError(result.data.message);
        return;
      }

      onClose();
    });
  };

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
              {...register('name')}
              placeholder={t('namePlaceholder')}
              style={inputStyle}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'profile-name-error' : undefined}
            />
            {errors.name && (
              <p
                id="profile-name-error"
                role="alert"
                style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}
              >
                {errors.name.message}
              </p>
            )}
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
              {...register('badge', { setValueAs: (v: string) => (v === '' ? undefined : v) })}
              placeholder={t('badgePlaceholder')}
              style={inputStyle}
              aria-invalid={!!errors.badge}
              aria-describedby={errors.badge ? 'profile-badge-error' : undefined}
            />
            {errors.badge ? (
              <p
                id="profile-badge-error"
                role="alert"
                style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}
              >
                {errors.badge.message}
              </p>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--mf-text-muted)' }}>{t('badgeHint')}</span>
            )}
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

          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit(onValid)}
            disabled={isPending}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: isPending ? 'not-allowed' : 'pointer',
              background: isPending ? 'var(--mf-surface-tint)' : 'var(--mf-accent)',
              color: isPending ? 'var(--mf-text-faint)' : '#fff',
              boxShadow: isPending ? 'none' : '0 2px 10px rgba(212,146,42,0.25)',
              transition: 'background 0.15s',
            }}
          >
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileEditModal;
