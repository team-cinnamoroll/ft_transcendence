import { cn } from "@/lib/utils";

export type SearchScope = "all" | "mine" | "subscribed";

type ScopeOption = {
  value: SearchScope;
  label: string;
};

const SCOPE_OPTIONS: ScopeOption[] = [
  { value: "all", label: "全体" },
  { value: "mine", label: "自分" },
  { value: "subscribed", label: "サブスクフェイス" },
];

type SearchScopeSelectorProps = {
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
};

/**
 * 検索スコープ切り替えタブ。
 * 「全体 / 自分 / サブスクフェイス」の 3 種類から選択する。
 */
const SearchScopeSelector = ({
  scope,
  onScopeChange,
}: SearchScopeSelectorProps) => {
  return (
    <div className="flex gap-1 rounded-lg bg-zinc-800/60 p-1">
      {SCOPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onScopeChange(option.value)}
          className={cn(
            "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
            scope === option.value
              ? "bg-violet-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SearchScopeSelector;
