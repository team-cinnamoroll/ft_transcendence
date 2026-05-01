'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { usePathname } from 'next/navigation';
import PostModal from '@/components/ui/PostModal';
import { useTranslations } from 'next-intl';

type TopBarProps = {
  pageTitle?: string;
};

/**
 * TopBar（グローバル上部バー）
 * PC 表示時に SideNav の右側、MainColumn・DetailPanel の上部に共通表示される。
 */
const TopBar = ({ pageTitle }: TopBarProps) => {
  const pathname = usePathname();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const t = useTranslations();

  const handleOpen = () => setIsPostModalOpen(true);
  const handleClose = () => setIsPostModalOpen(false);

  // ロケールプレフィックスを除いたパスを正規化して照合
  const normalizedPath = '/' + pathname.split('/').slice(2).join('/');

  const PAGE_TITLE_KEYS: Record<string, string> = {
    '/': 'nav.home',
    '/faces': 'nav.faces',
    '/notifications': 'nav.notifications',
    '/search': 'nav.search',
    '/subscriptions': 'nav.subscriptions',
  };

  const resolvedPageTitle =
    pageTitle ??
    (PAGE_TITLE_KEYS[normalizedPath] ? t(PAGE_TITLE_KEYS[normalizedPath]) : undefined) ??
    (normalizedPath.startsWith('/faces/') ? t('nav.faceDetail') : 'MultiFace');

  return (
    <>
      <header className="hidden md:flex items-center justify-between sticky top-0 z-10 h-12 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-4">
        {/* 左側: 現在のページ名 */}
        <span className="text-sm font-semibold text-zinc-400">{resolvedPageTitle}</span>

        {/* 右側: 投稿ボタン */}
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-2 rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-violet-900/40 hover:bg-violet-500 active:scale-95 active:bg-violet-700 transition-all"
        >
          <Pencil size={16} strokeWidth={2.5} />
          {t('topBar.post')}
        </button>
      </header>

      {isPostModalOpen && <PostModal isOpen={isPostModalOpen} onClose={handleClose} />}
    </>
  );
};

export default TopBar;
