'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const EXPORT_ENDPOINT = '/api/export';
const FALLBACK_FILENAME = 'multiface-export.json';

// Content-Disposition ヘッダから filename="..." を取り出す（無ければ既定名）
const resolveFilename = (contentDisposition: string | null): string => {
  if (!contentDisposition) return FALLBACK_FILENAME;
  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  return match?.[1] ?? FALLBACK_FILENAME;
};

// Blob を一時 URL 経由でダウンロードさせる
const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const DataExportButton = () => {
  const t = useTranslations('settings.data.export');
  const [isExporting, setIsExporting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleClick = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setHasError(false);

    try {
      const res = await fetch(EXPORT_ENDPOINT, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Failed to export data: ${res.status}`);
      }
      const blob = await res.blob();
      const filename = resolveFilename(res.headers.get('Content-Disposition'));
      triggerDownload(blob, filename);
    } catch {
      setHasError(true);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isExporting}
        style={{ ...buttonStyle, opacity: isExporting ? 0.6 : 1 }}
      >
        {isExporting ? t('loading') : t('button')}
      </button>
      {hasError && (
        <p role="alert" style={errorStyle}>
          {t('error')}
        </p>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 8,
  padding: '8px 16px',
  borderRadius: 10,
  border: '0.5px solid var(--mf-line)',
  background: 'var(--mf-surface)',
  color: 'var(--mf-brand)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--mf-danger, #d64545)',
  lineHeight: 1.5,
};

export default DataExportButton;
