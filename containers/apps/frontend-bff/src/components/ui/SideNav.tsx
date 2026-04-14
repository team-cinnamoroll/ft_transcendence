"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Bell, Search, Rss, Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import FaceNavItem from "@/components/ui/FaceNavItem";
import CreateFaceModal from "@/components/face/CreateFaceModal";
import { faceRepository } from "@/repositories/face-repository";
import { userRepository } from "@/repositories/user-repository";
import { useDetailPanel } from "@/lib/detail-panel-context";
import type { Face } from "@/types/face";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/subscriptions", label: "サブスク", icon: Rss },
  { href: "/notifications", label: "通知", icon: Bell },
  { href: "/search", label: "検索", icon: Search },
];

const SideNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentUser = userRepository.getCurrentUser();
  const faces = faceRepository.listByUserId(currentUser.id);
  const { openFace } = useDetailPanel();

  // パス名からアクティブなフェイスIDを導出
  const activeFaceId = pathname.startsWith("/faces/")
    ? pathname.split("/")[2]
    : undefined;

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);
  const handleCreateFace = (_face: Face) => {
    // モック実装: 作成後はモーダルを閉じるだけ（実際の永続化は行わない）
    setIsCreateModalOpen(false);
  };

  const handleFaceNavItemClick = (face: Face) => {
    router.push(`/faces/${face.id}`);
    openFace(face.id);
  };

  return (
    <>
      <nav className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen overflow-y-auto pt-6 pb-6 px-3 border-r border-zinc-800">
        {/* ロゴ・アプリ名 */}
        <div className="px-3 pb-4">
          <span className="text-xl font-bold text-violet-400 tracking-tight">
            MultiFace
          </span>
        </div>

        {/* ナビゲーションアイテム */}
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-violet-500/20 text-violet-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "shrink-0 transition-all duration-200",
                      isActive && "[&>*]:fill-current",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 区切り線 */}
        <hr className="my-3 border-t border-zinc-800" />

        {/* フェイス一覧ラベル */}
        <p className="px-3 mb-1 text-[12px] font-semibold uppercase tracking-wider text-zinc-600">
          フェイス
        </p>

        {/* フェイスリスト */}
        <ul className="flex flex-col gap-0.5">
          {faces.map((face) => (
            <FaceNavItem
              key={face.id}
              face={face}
              activeFaceId={activeFaceId}
              onClick={handleFaceNavItemClick}
            />
          ))}
        </ul>

        {/* 新規フェイス作成ボタン */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 w-full rounded-xl px-3 py-2 mt-2 text-sm font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-dashed border-zinc-700"
        >
          <Plus size={14} />
          新規フェイス作成
        </button>
      </nav>

      <CreateFaceModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onCreate={handleCreateFace}
      />
    </>
  );
};

export default SideNav;
