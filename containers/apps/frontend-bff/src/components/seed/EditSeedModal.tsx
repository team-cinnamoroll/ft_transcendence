'use client';

import { useState, useTransition } from 'react';
import type { Seed } from '@/types/seed';
import { updateSeedAction } from '@/server/actions/seeds';
import { useTranslations } from 'next-intl';

type FieldErrors = Record<string, string[]>;

type Props = {
  isOpen: boolean;
  seed: Seed;
  onClose: () => void;
  onUpdate: (seed: Seed) => void;
};

const EditSeedModal = ({ isOpen, seed, onClose, onUpdate }: Props) => {
  const [body, setBody] = useState(seed.body);
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const t = useTranslations('editSeedModal');

  const isValid = body.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid || isPending) return;

    startTransition(async () => {
      const result = await updateSeedAction(seed.id, {
        body: body.trim(),
        imageIds: seed.images.map((image) => image.id),
      });
      if (!result.success) {
        setFieldErrors(result.errors);
        return;
      }
      setFieldErrors(null);
      onUpdate(result.data);
      onClose();
    });
  };

  const handleClose = () => {
    setFieldErrors(null);
    setBody(seed.body);
    onClose();
  };

  if (!isOpen) return null;

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
          {/* 本文 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label
              htmlFor="edit-seed-body"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text-sub)' }}
            >
              {t('body')}
              <span style={{ marginLeft: 4, color: 'var(--mf-accent)' }}>{t('required')}</span>
            </label>
            <textarea
              id="edit-seed-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('bodyPlaceholder')}
              rows={5}
              style={{
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
                resize: 'none',
                lineHeight: 1.65,
              }}
            />
            {fieldErrors?.body?.map((msg) => (
              <span key={msg} style={{ fontSize: 11.5, color: 'var(--mf-danger, #e53e3e)' }}>
                {msg}
              </span>
            ))}
          </div>

          {/* 保存ボタン */}
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

export default EditSeedModal;
