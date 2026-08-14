'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { CreateSeedRequestSchema } from '@tracen/contracts';
import type { Face } from '@/types/face';
import type { CreateSeedRequest } from '@/types/seed';
import type { UserProfile } from '@/types/user-profile';
import { useTranslations } from 'next-intl';
import FaceBadge from '@/components/ui/FaceBadge';
import PdfThumbnail from '@/components/ui/PdfThumbnail';
import { getFaceTitle, getFaceColor, isImageFile } from '@/lib/display';
import { createSeedAction, uploadSeedImageAction } from '@/server/actions/seeds';
import { deleteUploadedFileAction } from '@/server/actions/file-storage';
import { useZodForm } from '@/lib/use-zod-form';
import { usePublishSeedCreated } from '@/lib/seed-created-provider';

const MAX_IMAGES = 4;
const MAX_LENGTH = 5000;

// backendのFileSizeSchemaと同じ上限（無駄なアップロードを避けるためのクライアント側の早期チェック）
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

// backendはmimeTypeの許可リスト検証をしていないため、フロントエンド側でjpeg/png/pdfのみに制限する
const ALLOWED_SEED_ATTACHMENT_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

type AttachedImage = {
  file: File;
  objectUrl: string;
  /** アップロード成功後にセットされる。file-storageへのfileId */
  fileId: string | null;
  isUploading: boolean;
  error: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  defaultFaceId?: string;
};

type ViewerApiResponse = {
  currentUser: UserProfile;
  myFaces: Face[];
};

const EMPTY_FACES: Face[] = [];

const PostModal = ({ isOpen, onClose, defaultFaceId }: Props) => {
  const t = useTranslations('postModal');
  const publishSeedCreated = usePublishSeedCreated();
  const [viewer, setViewer] = useState<ViewerApiResponse | null>(null);
  const [isViewerLoading, setIsViewerLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const imagesRef = useRef<AttachedImage[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (viewer) return;

    const controller = new AbortController();
    setIsViewerLoading(true);

    void fetch('/api/viewer', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch viewer: ${res.status}`);
        }
        return (await res.json()) as ViewerApiResponse;
      })
      .then((json) => {
        setViewer(json);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setViewer(null);
      })
      .finally(() => {
        setIsViewerLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [isOpen, viewer]);

  const myFaces = viewer?.myFaces ?? EMPTY_FACES;
  const initialSelectedFaceId = useMemo(() => {
    return defaultFaceId ?? myFaces[0]?.id ?? '';
  }, [defaultFaceId, myFaces]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useZodForm(CreateSeedRequestSchema, {
    mode: 'onChange',
    defaultValues: { faceId: initialSelectedFaceId, body: '', imageIds: [] },
  });
  const selectedFaceId = watch('faceId');
  const text = watch('body');
  const bodyField = register('body');

  const [images, setImages] = useState<AttachedImage[]>([]);
  const [showFacePicker, setShowFacePicker] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    setValue(
      'imageIds',
      images.flatMap((img) => (img.fileId ? [img.fileId] : []))
    );
  }, [images, setValue]);

  const selectedFace = myFaces.find((f) => f.id === selectedFaceId);

  useEffect(() => {
    if (!isOpen) return;
    setValue('faceId', initialSelectedFaceId);
  }, [initialSelectedFaceId, isOpen, setValue]);

  useEffect(() => {
    if (!isOpen) {
      // 保存されずに閉じられた場合、アップロード済みファイルは後始末として削除する（ベストエフォート）
      imagesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.objectUrl);
        if (img.fileId) {
          void deleteUploadedFileAction(img.fileId);
        }
      });
      setImages([]);
      reset({ faceId: initialSelectedFaceId, body: '', imageIds: [] });
      setShowFacePicker(false);
      setError(null);
    } else {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [initialSelectedFaceId, isOpen, reset]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.objectUrl);
        if (img.fileId) {
          void deleteUploadedFileAction(img.fileId);
        }
      });
    };
  }, []);

  const isUploadingImages = images.some((img) => img.isUploading);
  const imageUploadError = images.find((img) => img.error)?.error ?? null;

  const onValid = (data: CreateSeedRequest) => {
    if (isUploadingImages) return;
    setError(null);
    startTransition(async () => {
      const result = await createSeedAction(data);
      if (!result.success) {
        const firstFieldError = Object.values(result.errors)[0]?.[0];
        setError(firstFieldError ?? t('errorGeneric'));
        return;
      }
      // 投稿成功後にモーダルを閉じた際、未保存アップロードとして誤って削除されないよう先にクリアする
      images.forEach((img) => URL.revokeObjectURL(img.objectUrl));
      setImages([]);
      publishSeedCreated(result.data);
      onClose();
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);

    const newImages: AttachedImage[] = toAdd.map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
      fileId: null,
      isUploading: true,
      error: null,
    }));
    setImages((prev) => [...prev, ...newImages]);

    newImages.forEach((img) => {
      if (!ALLOWED_SEED_ATTACHMENT_FILE_TYPES.includes(img.file.type)) {
        setImages((prev) =>
          prev.map((i) =>
            i.objectUrl === img.objectUrl
              ? { ...i, isUploading: false, error: t('errorImageInvalidType') }
              : i
          )
        );
        return;
      }
      if (img.file.size > MAX_IMAGE_FILE_SIZE) {
        setImages((prev) =>
          prev.map((i) =>
            i.objectUrl === img.objectUrl
              ? { ...i, isUploading: false, error: t('errorImageTooLarge') }
              : i
          )
        );
        return;
      }

      const formData = new FormData();
      formData.set('file', img.file);

      void (async () => {
        const result = await uploadSeedImageAction(formData);
        setImages((prev) =>
          prev.map((i) => {
            if (i.objectUrl !== img.objectUrl) return i;
            if (!result.success) {
              const firstFieldError = Object.values(result.errors)[0]?.[0];
              return {
                ...i,
                isUploading: false,
                error: firstFieldError ?? t('errorImageInvalidType'),
              };
            }
            if (!result.data.success) {
              return { ...i, isUploading: false, error: result.data.message };
            }
            return { ...i, isUploading: false, fileId: result.data.fileId };
          })
        );
      })();
    });
  };

  const handleRemoveImage = (index: number) => {
    const target = images[index];
    if (target) {
      URL.revokeObjectURL(target.objectUrl);
      if (target.fileId) {
        void deleteUploadedFileAction(target.fileId);
      }
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('ariaLabel')}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'var(--mf-bg-light)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* トップバー */}
      <div
        style={{
          height: 52,
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '0.5px solid var(--mf-line)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 14,
            color: 'var(--mf-text-sub)',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 4px',
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
          >
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
          {t('cancel')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 公開設定 */}
          <button
            type="button"
            onClick={() => setVisibility((v) => (v === 'public' ? 'private' : 'public'))}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              background: 'var(--mf-surface-tint)',
              borderRadius: 999,
              fontSize: 11.5,
              color: 'var(--mf-text-sub)',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {visibility === 'public' ? (
              <>
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                >
                  <circle cx={8} cy={8} r={6} />
                  <path d="M2.5 8c0-1 1-3 5.5-3s5.5 2 5.5 3-1 3-5.5 3S2.5 9 2.5 8z" />
                  <circle cx={8} cy={8} r={2} fill="currentColor" />
                </svg>
                {t('visibilityPublic')}
              </>
            ) : (
              <>
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                >
                  <rect x={4} y={7} width={8} height={7} rx={1.5} />
                  <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
                </svg>
                {t('visibilityPrivate')}
              </>
            )}
          </button>

          {/* 投稿ボタン */}
          <button
            type="button"
            disabled={!isValid || isPending || isUploadingImages}
            onClick={handleSubmit(onValid)}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              background:
                isValid && !isPending && !isUploadingImages
                  ? 'var(--mf-accent)'
                  : 'var(--mf-surface-tint)',
              color: isValid && !isPending && !isUploadingImages ? '#fff' : 'var(--mf-text-faint)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.3,
              border: 'none',
              cursor: isValid && !isPending && !isUploadingImages ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              boxShadow:
                isValid && !isPending && !isUploadingImages
                  ? '0 2px 10px rgba(212,146,42,0.25)'
                  : 'none',
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
          >
            {isPending ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>

      {/* フェイス選択ピル */}
      <div style={{ padding: '4px 18px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowFacePicker((p) => !p)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 12px 6px 6px',
              background: selectedFace
                ? `${getFaceColor(selectedFace.id)}12`
                : 'var(--mf-surface-tint)',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedFace && <FaceBadge face={selectedFace} size={22} radius={6} />}
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: selectedFace ? getFaceColor(selectedFace.id) : 'var(--mf-text-muted)',
              }}
            >
              {isViewerLoading
                ? t('loading')
                : selectedFace
                  ? getFaceTitle(selectedFace)
                  : t('selectFace')}
            </span>
            <svg
              width={9}
              height={9}
              viewBox="0 0 10 7"
              fill="none"
              stroke={selectedFace ? getFaceColor(selectedFace.id) : 'var(--mf-text-muted)'}
              strokeWidth={1.6}
              strokeLinecap="round"
            >
              <path d="M1 1l4 4 4-4" />
            </svg>
          </button>
          <span style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>
            {t('writeToThisFace')}
          </span>
        </div>

        {/* フェイス選択ドロップダウン */}
        {showFacePicker && (
          <div
            style={{
              marginTop: 8,
              background: 'var(--mf-surface)',
              borderRadius: 12,
              border: '0.5px solid var(--mf-line)',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(30,42,74,0.1)',
            }}
          >
            {myFaces.map((face) => (
              <button
                key={face.id}
                type="button"
                onClick={() => {
                  setValue('faceId', face.id, { shouldValidate: true });
                  setShowFacePicker(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: face.id === selectedFaceId ? 'var(--mf-hover)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <FaceBadge face={face} size={28} radius={8} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mf-brand)' }}>
                  {getFaceTitle(face)}
                </span>
                {face.id === selectedFaceId && (
                  <svg
                    width={14}
                    height={14}
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="var(--mf-accent)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{ marginLeft: 'auto' }}
                  >
                    <path d="M2 7l4 4 6-7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 書き込みキャンバス */}
      <div style={{ flex: 1, padding: '4px 22px', overflowY: 'auto' }}>
        <textarea
          {...bodyField}
          ref={(el) => {
            bodyField.ref(el);
            textareaRef.current = el;
          }}
          maxLength={MAX_LENGTH}
          placeholder={t('textareaPlaceholder')}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 200,
            resize: 'none',
            border: 'none',
            background: 'transparent',
            fontSize: 17,
            lineHeight: 1.9,
            color: 'var(--mf-ink)',
            outline: 'none',
            fontFamily: 'var(--mf-font-sans)',
            caretColor: 'var(--mf-accent)',
          }}
        />

        {/* バリデーションエラー */}
        {errors.body && (
          <p style={{ color: 'var(--mf-error, #e53e3e)', fontSize: 13, margin: '4px 0 8px' }}>
            {errors.body.message}
          </p>
        )}
        {errors.faceId && (
          <p style={{ color: 'var(--mf-error, #e53e3e)', fontSize: 13, margin: '4px 0 8px' }}>
            {errors.faceId.message}
          </p>
        )}
        {error && (
          <p style={{ color: 'var(--mf-error, #e53e3e)', fontSize: 13, margin: '4px 0 8px' }}>
            {error}
          </p>
        )}
        {imageUploadError && (
          <p style={{ color: 'var(--mf-error, #e53e3e)', fontSize: 13, margin: '4px 0 8px' }}>
            {imageUploadError}
          </p>
        )}

        {/* 画像プレビュー */}
        {images.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: 3,
              borderRadius: 14,
              overflow: 'hidden',
              height: 150,
              border: '0.5px solid var(--mf-line-soft)',
              marginTop: 12,
            }}
          >
            {images.slice(0, 3).map((img, index) => (
              <div
                key={img.objectUrl}
                style={{
                  position: 'relative',
                  gridRow: index === 0 ? '1 / 3' : undefined,
                }}
              >
                {isImageFile(img.file.type) ? (
                  <Image
                    src={img.objectUrl}
                    alt={
                      img.isUploading
                        ? t('uploadingImageAlt', { n: index + 1 })
                        : t('attachedImageAlt', { n: index + 1 })
                    }
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <PdfThumbnail
                    src={img.objectUrl}
                    fileName={img.file.name}
                    fallbackLabel={t('pdfFileNameFallback')}
                  />
                )}
                {img.isUploading && (
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
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'rgba(20,24,36,0.70)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  aria-label={t('removeImageAriaLabel', { n: index + 1 })}
                >
                  <svg
                    width={10}
                    height={10}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                  >
                    <path d="M5 5l10 10M15 5L5 15" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ボトムバー */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '0.5px solid var(--mf-line)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        }}
      >
        {/* 画像添付 + リンクボタン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            disabled={images.length >= MAX_IMAGES}
            onClick={() => fileInputRef.current?.click()}
            aria-label={t('addPhotoAriaLabel')}
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: images.length >= MAX_IMAGES ? 'none' : 'var(--mf-surface-tint)',
              border: 'none',
              cursor: images.length >= MAX_IMAGES ? 'not-allowed' : 'pointer',
              color: images.length >= MAX_IMAGES ? 'var(--mf-text-faint)' : 'var(--mf-brand)',
            }}
          >
            <svg
              width={22}
              height={22}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x={3} y={3} width={14} height={14} rx={2} />
              <circle cx={7} cy={7.5} r={1.2} />
              <path d="M3 14l4-4 4 4 3-3 3 3" />
            </svg>
            {images.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 1,
                  right: 1,
                  background: 'var(--mf-accent)',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 700,
                  minWidth: 14,
                  height: 14,
                  padding: '0 3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                {images.length}
              </span>
            )}
          </button>
        </div>

        {/* 文字数カウント */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13.5,
            fontWeight: 600,
            color: 'var(--mf-text-sub)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{t('charCount', { n: text.length })}</span>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
