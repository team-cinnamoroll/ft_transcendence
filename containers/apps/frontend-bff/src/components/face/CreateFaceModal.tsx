'use client';

import { useState, useTransition } from 'react';
import type { Face } from '@/types/face';
import { createFaceAction } from '@/server/actions/faces';
import { useTranslations } from 'next-intl';

type FieldErrors = Record<string, string[]>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (face: Face) => void;
};

const CreateFaceModal = ({ isOpen, onClose, onCreate }: Props) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const t = useTranslations('createFaceModal');

  const isValid = name.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid || isPending) return;

    startTransition(async () => {
      const result = await createFaceAction({
        name: name.trim(),
        emoji: emoji.trim() || undefined,
        description: description.trim() || undefined,
        isPrivate,
      });
      if (!result.success) {
        setFieldErrors(result.errors);
        return;
      }
      setFieldErrors(null);
      onCreate(result.data);
      handleClose();
    });
  };

  const handleClose = () => {
    setName('');
    setEmoji('');
    setDescription('');
    setIsPrivate(false);
    setFieldErrors(null);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px' }}>
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
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 18px 20px' }}>
          {/* 名前（必須） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label htmlFor="face-name" style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}>
              {t('name')}
              <span style={{ marginLeft: 4, color: 'var(--mf-accent)' }}>{t('required')}</span>
            </label>
            <input
              id="face-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('nameExample')}
              style={inputStyle}
            />
            {fieldErrors?.name?.map((msg) => (
              <span key={msg} style={{ fontSize: 11.5, color: 'var(--mf-danger, #e53e3e)' }}>
                {msg}
              </span>
            ))}
          </div>

          {/* 絵文字（任意） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label htmlFor="face-emoji" style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}>
              {t('emoji')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <input
              id="face-emoji"
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder={t('emojiExample')}
              style={inputStyle}
            />
          </div>

          {/* 説明文（任意） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label htmlFor="face-description" style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}>
              {t('description')}
              <span style={{ marginLeft: 4, color: 'var(--mf-text-muted)' }}>{t('optional')}</span>
            </label>
            <textarea
              id="face-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
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
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mf-text)' }}>{t('privateLabel')}</span>
              <span style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>{t('privateDescription')}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPrivate}
              onClick={() => setIsPrivate((prev) => !prev)}
              style={{
                position: 'relative',
                width: 44,
                height: 24,
                flexShrink: 0,
                borderRadius: 999,
                background: isPrivate ? 'var(--mf-brand)' : 'var(--mf-surface-tint)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: isPrivate ? 22 : 2,
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

          {/* 作成ボタン */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: isValid && !isPending ? 'pointer' : 'not-allowed',
              background: isValid && !isPending ? 'var(--mf-accent)' : 'var(--mf-surface-tint)',
              color: isValid && !isPending ? '#fff' : 'var(--mf-text-faint)',
              boxShadow: isValid && !isPending ? '0 2px 10px rgba(212,146,42,0.25)' : 'none',
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
