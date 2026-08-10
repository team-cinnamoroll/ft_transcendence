'use client';

import { useState } from 'react';

export type SortOption<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  options: SortOption<T>[];
  onChange: (value: T) => void;
};

/** ソートキーを選ぶドロップダウン。見た目のみを持ち、実際の並べ替え処理は呼び出し側が行う */
const SortMenu = <T extends string>({ value, options, onChange }: Props<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find((option) => option.key === value);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 12.5,
          color: 'var(--mf-text-sub)',
          fontWeight: 600,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
        }}
      >
        {current?.label}
        <svg
          width={12}
          height={12}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 20,
            background: 'var(--mf-surface)',
            borderRadius: 10,
            border: '0.5px solid var(--mf-line)',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(30,42,74,0.12)',
            minWidth: 140,
          }}
        >
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                onChange(option.key);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: 13,
                fontWeight: value === option.key ? 700 : 400,
                color: value === option.key ? 'var(--mf-brand)' : 'var(--mf-text)',
                background: value === option.key ? 'var(--mf-hover)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortMenu;
