// Storybook 用 next/navigation モック
// usePathname / useRouter など Next.js のナビゲーション hooks をダミー実装に置き換える

export const usePathname = (): string => {
  return '/';
};

export const useRouter = () => {
  return {
    push: (_href: string) => {},
    replace: (_href: string) => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: (_href: string) => {},
  };
};

export const useSearchParams = () => {
  return new URLSearchParams();
};

export const useParams = () => {
  return {};
};
