'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { UpdateFaceRequestSchema } from '@tracen/contracts';
import type { Face, UpdateFaceRequest } from '@/types/face';
import { updateFaceAction, uploadFaceImageAction } from '@/server/actions/faces';
import { deleteUploadedFileAction } from '@/server/actions/file-storage';
import { useTranslations } from 'next-intl';
import { useZodForm } from '@/lib/use-zod-form';

type Props = {
  isOpen: boolean;
  face: Face;
  onClose: () => void;
  onUpdate: (face: Face) => void;
};

// backendのFileSizeSchemaと同じ上限（無駄なアップロードを避けるためのクライアント側の早期チェック）
const MAX_FACE_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

// backendはmimeTypeの許可リスト検証をしていないため、フロントエンド側でjpeg/pngのみに制限する
const ALLOWED_FACE_IMAGE_FILE_TYPES = ['image/jpeg', 'image/png'];

const EditFaceModal = ({ isOpen, face, onClose, onUpdate }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('editFaceModal');

  // モーダルを開いた時点で設定されていた画像のファイルID（差し替え検知・後始末の削除対象の判定に使う）
  const originalImageId = face.image?.id ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useZodForm(UpdateFaceRequestSchema, {
    mode: 'onChange',
    defaultValues: {
      name: face.name,
      emoji: face.emoji,
      description: face.description,
      imageId: originalImageId,
    },
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(face.image?.url ?? null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  // アップロード済みだが、まだ保存(PUT)には至っていないファイルのID。後始末の削除対象を追跡する
  const uploadedFileIdRef = useRef<string | null>(null);

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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同じファイルを選び直しても onChange が発火するようにする
    if (!file) return;

    if (
      !ALLOWED_FACE_IMAGE_FILE_TYPES.includes(file.type) ||
      file.size > MAX_FACE_IMAGE_FILE_SIZE
    ) {
      setImageError(t('errorImageInvalidType'));
      return;
    }

    // 前回アップロード済みで未保存のファイルがあれば、後始末として削除する
    discardPendingUpload();

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setImageError(null);
    // imageIdはここでは変更しない（アップロードが失敗した場合に、既存の画像を消してしまわないため）
    setIsUploadingImage(true);

    const formData = new FormData();
    formData.set('file', file);

    void (async () => {
      const result = await uploadFaceImageAction(formData);
      setIsUploadingImage(false);

      if (!result.success) {
        const firstFieldError = Object.values(result.errors)[0]?.[0];
        setImageError(firstFieldError ?? t('errorImageInvalidType'));
        return;
      }
      if (!result.data.success) {
        setImageError(result.data.message);
        return;
      }

      uploadedFileIdRef.current = result.data.fileId;
      setValue('imageId', result.data.fileId, { shouldValidate: true });
    })();
  };

  const onValid = (data: UpdateFaceRequest) => {
    if (isPending || isUploadingImage) return;

    setError(null);
    startTransition(async () => {
      const result = await updateFaceAction(face.id, data);
      if (!result.success) {
        const firstFieldError = Object.values(result.errors)[0]?.[0];
        setError(firstFieldError ?? t('errorGeneric'));
        return;
      }

      // 保存に成功したので、これ以降はモーダルを閉じても削除対象にしない
      uploadedFileIdRef.current = null;

      // 差し替えた場合、置き換えられた古いファイルを後始末として削除する（ベストエフォート）
      if (originalImageId && data.imageId !== originalImageId) {
        void deleteUploadedFileAction(originalImageId);
      }

      onUpdate(result.data);
      onClose();
    });
  };

  const handleClose = () => {
    discardPendingUpload();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

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
      {/* オーバーレイ */}
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

      {/* モーダルパネル */}
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
        {/* ヘッダー */}
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
          {/* 名前（必須） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label
              htmlFor="edit-face-name"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('name')}
              <span style={{ marginLeft: 4, color: 'var(--mf-accent)' }}>{t('required')}</span>
            </label>
            <input
              id="edit-face-name"
              type="text"
              {...register('name')}
              placeholder={t('nameExample')}
              style={inputStyle}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'edit-face-name-error' : undefined}
            />
            {errors.name && (
              <span
                id="edit-face-name-error"
                role="alert"
                style={{ fontSize: 11.5, color: 'var(--mf-danger, #e53e3e)' }}
              >
                {errors.name.message}
              </span>
            )}
          </div>

          {/* 絵文字（任意） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label
              htmlFor="edit-face-emoji"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('emoji')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <input
              id="edit-face-emoji"
              type="text"
              {...register('emoji', {
                setValueAs: (v: string | null) => (v == null || v.trim() === '' ? null : v.trim()),
              })}
              placeholder={t('emojiExample')}
              style={inputStyle}
              aria-invalid={!!errors.emoji}
              aria-describedby={errors.emoji ? 'edit-face-emoji-error' : undefined}
            />
            {errors.emoji && (
              <span
                id="edit-face-emoji-error"
                role="alert"
                style={{ fontSize: 11.5, color: 'var(--mf-danger, #e53e3e)' }}
              >
                {errors.emoji.message}
              </span>
            )}
          </div>

          {/* 説明文（任意） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label
              htmlFor="edit-face-description"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('description')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <textarea
              id="edit-face-description"
              {...register('description', {
                setValueAs: (v: string | null) => (v == null || v.trim() === '' ? null : v.trim()),
              })}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'edit-face-description-error' : undefined}
            />
            {errors.description && (
              <span
                id="edit-face-description-error"
                role="alert"
                style={{ fontSize: 11.5, color: 'var(--mf-danger, #e53e3e)' }}
              >
                {errors.description.message}
              </span>
            )}
          </div>

          {/* 画像（任意） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}>
              {t('image')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {previewUrl && (
                <div
                  style={{
                    position: 'relative',
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--mf-surface)',
                  }}
                >
                  <Image
                    src={previewUrl}
                    alt={t('image')}
                    width={52}
                    height={52}
                    style={{ objectFit: 'cover', display: 'block' }}
                  />
                  {isUploadingImage && (
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
              )}
              <label
                htmlFor="edit-face-image-file"
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: '0.5px solid var(--mf-line)',
                  background: 'var(--mf-surface)',
                  color: 'var(--mf-brand)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                }}
              >
                {isUploadingImage ? t('uploading') : t('imageSelectButton')}
              </label>
              <input
                id="edit-face-image-file"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageFileChange}
                disabled={isUploadingImage}
                style={{ display: 'none' }}
              />
            </div>
            {imageError && (
              <p
                role="alert"
                style={{ margin: 0, fontSize: 12, color: 'var(--mf-danger, #e53e3e)' }}
              >
                {imageError}
              </p>
            )}
          </div>

          {/* 公開設定（作成後は変更不可のため読み取り専用で表示） */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 12,
              border: '0.5px solid var(--mf-line)',
              background: 'var(--mf-surface)',
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mf-text)' }}>
                {face.visibility === 'private' ? t('privateLabel') : t('publicLabel')}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>
                {t('visibilityImmutableHint')}
              </span>
            </div>
            <span
              style={{
                flexShrink: 0,
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                background:
                  face.visibility === 'private' ? 'var(--mf-brand)' : 'var(--mf-surface-tint)',
                color: face.visibility === 'private' ? '#fff' : 'var(--mf-text-sub)',
              }}
            >
              {face.visibility === 'private' ? t('privateLabel') : t('publicLabel')}
            </span>
          </div>

          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--mf-danger, #e53e3e)' }}>
              {error}
            </p>
          )}

          {/* 保存ボタン */}
          <button
            type="button"
            onClick={handleSubmit(onValid)}
            disabled={!isValid || isPending || isUploadingImage}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: isValid && !isPending && !isUploadingImage ? 'pointer' : 'not-allowed',
              background:
                isValid && !isPending && !isUploadingImage
                  ? 'var(--mf-accent)'
                  : 'var(--mf-surface-tint)',
              color: isValid && !isPending && !isUploadingImage ? '#fff' : 'var(--mf-text-faint)',
              boxShadow:
                isValid && !isPending && !isUploadingImage
                  ? '0 2px 10px rgba(212,146,42,0.25)'
                  : 'none',
              transition: 'background 0.15s',
            }}
          >
            {isPending ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>
    </>
  );
};

export default EditFaceModal;
