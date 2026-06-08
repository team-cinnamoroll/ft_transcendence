import { useTranslations } from 'next-intl';

export type SearchScope = 'all' | 'mine' | 'subscribed';

type ScopeOption = {
  value: SearchScope;
  label: string;
};

type SearchScopeSelectorProps = {
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
};

const SearchScopeSelector = ({ scope, onScopeChange }: SearchScopeSelectorProps) => {
  const t = useTranslations('searchScopeSelector');

  const SCOPE_OPTIONS: ScopeOption[] = [
    { value: 'all', label: t('all') },
    { value: 'mine', label: t('mine') },
    { value: 'subscribed', label: t('subscribed') },
  ];

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {SCOPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onScopeChange(option.value)}
          style={{
            padding: '5px 16px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: scope === option.value ? 700 : 400,
            background: scope === option.value ? 'var(--mf-brand)' : 'var(--mf-surface-tint)',
            color: scope === option.value ? '#fff' : 'var(--mf-text-sub)',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SearchScopeSelector;
