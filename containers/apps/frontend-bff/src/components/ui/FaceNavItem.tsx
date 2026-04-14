"use client";

import { cn } from "@/lib/utils";
import type { Face } from "@/types/face";

type Props = {
  face: Face;
  /** DetailPanel に表示中のフェイス ID（アクティブ状態の判定に使用）*/
  activeFaceId?: string;
  /** クリック時のコールバック（Issue #79/#80 で DetailPanel と連携） */
  onClick?: (face: Face) => void;
};

const FaceNavItem = ({ face, activeFaceId, onClick }: Props) => {
  const isActive = activeFaceId === face.id;

  const handleClick = () => {
    onClick?.(face);
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-violet-500/20 text-violet-400"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
        )}
      >
        {/* 絵文字 or 頭文字フォールバック */}
        {face.emoji ? (
          <span className="text-base leading-none">{face.emoji}</span>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300 shrink-0">
            {face.name.slice(0, 1)}
          </span>
        )}

        <span className="truncate text-sm">{face.name}</span>
      </button>
    </li>
  );
};

export default FaceNavItem;
