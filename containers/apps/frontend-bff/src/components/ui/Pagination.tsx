'use client';

import { useTranslations } from 'next-intl';

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function buildPageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const around = new Set(
    [1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total)
  );
  const sorted = [...around].sort((a, b) => a - b);
  const result: (number | '...')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push('...');
    result.push(p);
    prev = p;
  }
  return result;
}

const btnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
  minWidth: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  border: 'none',
  padding: '0 6px',
  background: active ? 'var(--mf-accent)' : disabled ? 'transparent' : 'var(--mf-surface)',
  color: active ? '#fff' : disabled ? 'var(--mf-text-muted)' : 'var(--mf-brand)',
  opacity: disabled ? 0.4 : 1,
  cursor: disabled ? 'default' : 'pointer',
  transition: 'background 0.15s',
});

const Pagination = ({ currentPage, totalPages, onPageChange }: Props) => {
  const t = useTranslations('pagination');
  if (totalPages <= 1) return null;
  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav
      aria-label={t('ariaLabel')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        justifyContent: 'center',
        padding: '16px 0',
      }}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t('prev')}
        style={btnStyle(false, currentPage === 1)}
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`dots-${i}`}
            style={{ padding: '0 2px', color: 'var(--mf-text-muted)', fontSize: 13 }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={t('page', { n: p })}
            aria-current={p === currentPage ? 'page' : undefined}
            style={btnStyle(p === currentPage, false)}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t('next')}
        style={btnStyle(false, currentPage === totalPages)}
      >
        →
      </button>
    </nav>
  );
};

export default Pagination;
