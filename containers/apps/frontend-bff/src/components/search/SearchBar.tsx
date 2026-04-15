type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * キーワード入力フィールド。
 * 入力のたびに onChange を呼び出し、親コンポーネントが状態を管理する。
 */
const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="キーワードで検索..."
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
      />
    </div>
  );
};

export default SearchBar;
