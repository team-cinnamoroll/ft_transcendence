'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  /** PDFのURL(投稿前プレビューではBlob URL、投稿後表示では配信URL) */
  src: string;
  fileName?: string;
  /** fileNameが無い場合に表示する代替テキスト(i18n対応のため呼び出し側から渡す) */
  fallbackLabel: string;
};

let workerConfigured = false;

/** pdf.jsのWorkerスクリプトを一度だけ設定する */
const configureWorker = async () => {
  if (workerConfigured) return;
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  workerConfigured = true;
};

/**
 * PDFの1ページ目をcanvasに描画してサムネイル表示する。
 * 読み込み中・失敗時はアイコン+ファイル名の簡易表示にフォールバックする。
 */
const PdfThumbnail = ({ src, fileName, fallbackLabel }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsRendered(false);
    setHasError(false);

    (async () => {
      try {
        await configureWorker();
        const pdfjsLib = await import('pdfjs-dist');
        const pdf = await pdfjsLib.getDocument({ url: src }).promise;
        if (cancelled) return;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        if (!cancelled) setIsRendered(true);
      } catch {
        if (!cancelled) setHasError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  const label = fileName ?? fallbackLabel;
  const showFallback = !isRendered || hasError;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--mf-surface-tint)',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label={label}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: showFallback ? 'none' : 'block',
        }}
      />
      {showFallback && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: 8,
          }}
        >
          <svg
            width={26}
            height={26}
            viewBox="0 0 20 20"
            fill="none"
            stroke="var(--mf-text-sub)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 2.5h7l3 3v12a1 1 0 01-1 1H5a1 1 0 01-1-1v-14a1 1 0 011-1z" />
            <path d="M12 2.5v3h3" />
          </svg>
          <span
            style={{
              fontSize: 10.5,
              color: 'var(--mf-text-sub)',
              fontWeight: 600,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

export default PdfThumbnail;
