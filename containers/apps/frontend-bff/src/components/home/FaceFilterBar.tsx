"use client";

import { type Face } from "@/types/face";
import { cn } from "@/lib/utils";

type FaceFilterBarProps = {
  faces: Face[];
  selectedFaceId: string | null;
  onSelect: (faceId: string | null) => void;
};

/**
 * フェイスアイコン一覧（横スクロール）。
 * タップで該当フェイスのアクティビティに絞り込む Client Component。
 * 「すべて」ボタンでフィルタを解除できる。
 */
const FaceFilterBar = ({ faces, selectedFaceId, onSelect }: FaceFilterBarProps) => {
  const handleSelectAll = () => {
    onSelect(null);
  };

  const handleSelectFace = (faceId: string) => {
    // 同じフェイスを再タップしたらフィルタ解除
    onSelect(selectedFaceId === faceId ? null : faceId);
  };

  return (
    <div className="overflow-x-auto border-b border-zinc-800 px-4 py-3">
      <div className="flex items-center gap-2 w-max">
        {/* すべてボタン */}
        <button
          type="button"
          onClick={handleSelectAll}
          className={cn(
            "flex flex-col items-center gap-1 flex-shrink-0",
            "focus:outline-none",
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all",
              selectedFaceId === null
                ? "bg-violet-600 ring-2 ring-violet-400 ring-offset-2 ring-offset-zinc-950"
                : "bg-zinc-800 hover:bg-zinc-700",
            )}
          >
            🌐
          </span>
          <span
            className={cn(
              "text-[10px] leading-none max-w-[44px] truncate",
              selectedFaceId === null ? "text-violet-400" : "text-zinc-500",
            )}
          >
            すべて
          </span>
        </button>

        {/* 各フェイスボタン */}
        {faces.map((face) => {
          const isActive = selectedFaceId === face.id;
          const icon = face.emoji ?? face.name.slice(0, 1);

          return (
            <button
              key={face.id}
              type="button"
              onClick={() => handleSelectFace(face.id)}
              className={cn(
                "flex flex-col items-center gap-1 flex-shrink-0",
                "focus:outline-none",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all",
                  isActive
                    ? "bg-violet-600 ring-2 ring-violet-400 ring-offset-2 ring-offset-zinc-950"
                    : "bg-zinc-800 hover:bg-zinc-700",
                )}
              >
                {icon}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-none max-w-[44px] truncate",
                  isActive ? "text-violet-400" : "text-zinc-500",
                )}
              >
                {face.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FaceFilterBar;
