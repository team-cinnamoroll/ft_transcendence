'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { CreateFaceRequestSchema } from '@tracen/contracts';
import type { CreateFaceRequest, Face } from '@/types/face';
import { createFaceAction, uploadFaceImageAction } from '@/server/actions/faces';
import { deleteUploadedFileAction } from '@/server/actions/file-storage';
import { useTranslations } from 'next-intl';
import { useZodForm } from '@/lib/use-zod-form';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (face: Face) => void;
};

// backendのFileSizeSchemaと同じ上限（無駄なアップロードを避けるためのクライアント側の早期チェック）
const MAX_FACE_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

// backendはmimeTypeの許可リスト検証をしていないため、フロントエンド側でjpeg/pngのみに制限する
const ALLOWED_FACE_IMAGE_FILE_TYPES = ['image/jpeg', 'image/png'];

const CreateFaceModal = ({ isOpen, onClose, onCreate }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('createFaceModal');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useZodForm(CreateFaceRequestSchema, {
    mode: 'onChange',
    defaultValues: {
      name: '',
      emoji: null,
      description: null,
      imageId: null,
      visibility: 'public',
    },
  });
  const visibility = watch('visibility');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  // アップロード済みだが、まだ保存(POST)には至っていないファイルのID。後始末の削除対象を追跡する
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

    if (!ALLOWED_FACE_IMAGE_FILE_TYPES.includes(file.type)) {
      setImageError(t('errorImageInvalidType'));
      return;
    }

    if (file.size > MAX_FACE_IMAGE_FILE_SIZE) {
      setImageError(t('errorImageTooLarge'));
      return;
    }

    // 前回アップロード済みで未保存のファイルがあれば、後始末として削除する
    discardPendingUpload();

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setImageError(null);
    setIsUploadingImage(true);

    const formData = new FormData();
    formData.set('file', file);

    void (async () => {
      try {
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
      } catch (err) {
        // Server Actionのリクエストボディサイズ上限超過など、想定外の通信エラー用のフォールバック
        console.error('CreateFaceModal: uploadFaceImageAction threw unexpectedly', err);
        setIsUploadingImage(false);
        setImageError(t('errorImageUploadFailed'));
      }
    })();
  };

  const onValid = (data: CreateFaceRequest) => {
    if (isPending || isUploadingImage) return;

    setError(null);
    startTransition(async () => {
      const result = await createFaceAction(data);
      if (!result.success) {
        const firstFieldError = Object.values(result.errors)[0]?.[0];
        setError(firstFieldError ?? t('errorGeneric'));
        return;
      }
      // 保存に成功したので、これ以降はモーダルを閉じても削除対象にしない
      uploadedFileIdRef.current = null;
      onCreate(result.data);
      handleClose();
    });
  };

  const handleClose = () => {
    discardPendingUpload();
    reset();
    setPreviewUrl(null);
    setImageError(null);
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
              htmlFor="face-name"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('name')}
              <span style={{ marginLeft: 4, color: 'var(--mf-accent)' }}>{t('required')}</span>
            </label>
            <input
              id="face-name"
              type="text"
              {...register('name')}
              placeholder={t('nameExample')}
              style={inputStyle}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'face-name-error' : undefined}
            />
            {errors.name && (
              <span
                id="face-name-error"
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
              htmlFor="face-emoji"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('emoji')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <input
              id="face-emoji"
              type="text"
              {...register('emoji', {
                setValueAs: (v: string | null) => (v == null || v.trim() === '' ? null : v.trim()),
              })}
              placeholder={t('emojiExample')}
              style={inputStyle}
              aria-invalid={!!errors.emoji}
              aria-describedby={errors.emoji ? 'face-emoji-error' : undefined}
            />
            {errors.emoji && (
              <span
                id="face-emoji-error"
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
              htmlFor="face-description"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('description')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <textarea
              id="face-description"
              {...register('description', {
                setValueAs: (v: string | null) => (v == null || v.trim() === '' ? null : v.trim()),
              })}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'face-description-error' : undefined}
            />
            {errors.description && (
              <span
                id="face-description-error"
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
                htmlFor="face-image-file"
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
                id="face-image-file"
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

          {/* 公開/非公開トグル */}
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
                {t('privateLabel')}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>
                {t('privateDescription')}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={visibility === 'private'}
              onClick={() =>
                setValue('visibility', visibility === 'private' ? 'public' : 'private')
              }
              style={{
                position: 'relative',
                width: 44,
                height: 24,
                flexShrink: 0,
                borderRadius: 999,
                background: visibility === 'private' ? 'var(--mf-brand)' : 'var(--mf-surface-tint)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: visibility === 'private' ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>

          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--mf-danger, #e53e3e)' }}>
              {error}
            </p>
          )}

          {/* 作成ボタン */}
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

export default CreateFaceModal;
