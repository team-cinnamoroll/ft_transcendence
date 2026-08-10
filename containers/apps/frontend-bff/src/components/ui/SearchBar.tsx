'use client';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/** 虫眼鏡アイコン+入力欄+クリアボタンの検索バー。検索対象・検索処理は呼び出し側が持つ */
const SearchBar = ({ value, onChange, placeholder }: Props) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--mf-surface)',
        borderRadius: 12,
        border: '0.5px solid var(--mf-line)',
      }}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill="none"
        stroke="var(--mf-text-muted)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={6.5} cy={6.5} r={4.5} />
        <path d="M10.5 10.5L14 14" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          fontSize: 13.5,
          color: 'var(--mf-text)',
          outline: 'none',
          fontFamily: 'var(--mf-font-sans)',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--mf-text-muted)',
            padding: 0,
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          >
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
