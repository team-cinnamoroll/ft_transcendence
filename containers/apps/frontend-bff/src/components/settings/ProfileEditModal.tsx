'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { UserProfileUpsertRequestSchema } from '@tracen/contracts';
import type { UserProfile, UserProfileUpsertRequest } from '@/types/user-profile';
import { getAvatarUrl } from '@/lib/display';
import { updateUserProfileAction } from '@/server/actions/user-profile';
import { uploadAvatarFileAction, deleteUploadedFileAction } from '@/server/actions/file-storage';
import { buildZodErrorMap } from '@/lib/zod-error-map';

type Props = {
  user: UserProfile;
  onClose: () => void;
};

type ProfileFormFields = Pick<UserProfileUpsertRequest, 'name' | 'badge'>;

const profileFormSchema = UserProfileUpsertRequestSchema.pick({ name: true, badge: true });

// backendのFileSizeSchemaと同じ上限（無駄なアップロードを避けるためのクライアント側の早期チェック）
const MAX_AVATAR_FILE_SIZE = 10 * 1024 * 1024;

// backendはmimeTypeの許可リスト検証をしていないため、フロントエンド側でjpeg/pngのみに制限する
const ALLOWED_AVATAR_FILE_TYPES = ['image/jpeg', 'image/png'];

const ProfileEditModal = ({ user, onClose }: Props) => {
  const t = useTranslations('profileEditModal');
  const tValidation = useTranslations('validation');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [previewUrl, setPreviewUrl] = useState<string>(getAvatarUrl(user));
  const [avatarFileId, setAvatarFileId] = useState<string | undefined>(undefined);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  // アップロード済みだが、まだ保存(PUT)には至っていないファイルのID。後始末の削除対象を追跡する
  const uploadedFileIdRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormFields>({
    resolver: zodResolver(profileFormSchema, { error: buildZodErrorMap(tValidation) }),
    defaultValues: { name: user.name, badge: user.badge },
  });

  const discardPendingUpload = () => {
    if (uploadedFileIdRef.current) {
      void deleteUploadedFileAction(uploadedFileIdRef.current);
      uploadedFileIdRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleClose = () => {
    discardPendingUpload();
    onClose();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同じファイルを選び直しても onChange が発火するようにする
    if (!file) return;

    if (!ALLOWED_AVATAR_FILE_TYPES.includes(file.type)) {
      setAvatarError(t('errorAvatarInvalidType'));
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setAvatarError(t('errorAvatarUploadFailed'));
      return;
    }

    // 前回アップロード済みで未保存のファイルがあれば、後始末として削除する
    discardPendingUpload();

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setAvatarError(null);
    setAvatarFileId(undefined);
    setIsUploadingAvatar(true);

    const formData = new FormData();
    formData.set('file', file);

    void (async () => {
      const result = await uploadAvatarFileAction(formData);
      setIsUploadingAvatar(false);

      if (!result.success) {
        const firstFieldError = Object.values(result.errors)[0]?.[0];
        setAvatarError(firstFieldError ?? t('errorAvatarUploadFailed'));
        return;
      }
      if (!result.data.success) {
        setAvatarError(result.data.message);
        return;
      }

      uploadedFileIdRef.current = result.data.fileId;
      setAvatarFileId(result.data.fileId);
    })();
  };

  const onValid = (data: ProfileFormFields) => {
    if (isPending || isUploadingAvatar) return;

    setError(null);
    startTransition(async () => {
      const result = await updateUserProfileAction({ ...data, avatarFileId });

      if (!result.success) {
        const firstFieldError = Object.values(result.errors)[0]?.[0];
        setError(firstFieldError ?? t('errorGeneric'));
        return;
      }
      if (!result.data.success) {
        setError(result.data.message);
        return;
      }

      // 保存に成功したので、これ以降はモーダルを閉じても削除対象にしない
      uploadedFileIdRef.current = null;
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
        onClick={handleClose}
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
            onClick={handleClose}
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
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}>
              {t('avatar')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  position: 'relative',
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--mf-surface)',
                }}
              >
                <Image
                  src={previewUrl}
                  alt={t('avatar')}
                  width={52}
                  height={52}
                  style={{ objectFit: 'cover', display: 'block' }}
                />
                {isUploadingAvatar && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(20,24,36,0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      className="mf-spin"
                      width={20}
                      height={20}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="#fff"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M10 2a8 8 0 018 8" />
                    </svg>
                  </div>
                )}
              </div>

              <label
                htmlFor="profile-avatar-file"
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: '0.5px solid var(--mf-line)',
                  background: 'var(--mf-surface)',
                  color: 'var(--mf-brand)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: isUploadingAvatar ? 'not-allowed' : 'pointer',
                }}
              >
                {isUploadingAvatar ? t('uploading') : t('avatarSelectButton')}
              </label>
              <input
                id="profile-avatar-file"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleAvatarFileChange}
                disabled={isUploadingAvatar}
                style={{ display: 'none' }}
              />
            </div>
            {avatarError && (
              <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}>
                {avatarError}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit(onValid)}
            disabled={isPending || isUploadingAvatar}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: isPending || isUploadingAvatar ? 'not-allowed' : 'pointer',
              background:
                isPending || isUploadingAvatar ? 'var(--mf-surface-tint)' : 'var(--mf-accent)',
              color: isPending || isUploadingAvatar ? 'var(--mf-text-faint)' : '#fff',
              boxShadow:
                isPending || isUploadingAvatar ? 'none' : '0 2px 10px rgba(212,146,42,0.25)',
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
