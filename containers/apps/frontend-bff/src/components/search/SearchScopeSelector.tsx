import { cn } from '@/lib/utils';
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

/**
 * 検索スコープ切り替えタブ。
 */
const SearchScopeSelector = ({ scope, onScopeChange }: SearchScopeSelectorProps) => {
  const t = useTranslations('searchScopeSelector');
  const SCOPE_OPTIONS: ScopeOption[] = [
    { value: 'all', label: t('all') },
    { value: 'mine', label: t('mine') },
    { value: 'subscribed', label: t('subscribed') },
  ];
  return (
    <div className="flex gap-1 rounded-lg bg-zinc-800/60 p-1">
      {SCOPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onScopeChange(option.value)}
          className={cn(
            'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
            scope === option.value
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SearchScopeSelector;
