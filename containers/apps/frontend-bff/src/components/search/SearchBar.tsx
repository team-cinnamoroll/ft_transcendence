import { useTranslations } from 'next-intl';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  const t = useTranslations('searchBar');
  return (
    <div style={{ position: 'relative' }}>
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: 12,
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--mf-text-muted)',
        }}
      >
        <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={7} cy={7} r={4.5} />
          <path d="M10.5 10.5l3 3" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('placeholder')}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 12,
          border: '0.5px solid var(--mf-line)',
          background: 'var(--mf-surface)',
          padding: '10px 14px 10px 36px',
          fontSize: 14,
          color: 'var(--mf-ink)',
          fontFamily: 'var(--mf-font-sans)',
          outline: 'none',
        }}
      />
    </div>
  );
};

export default SearchBar;
