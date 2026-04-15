"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Face } from "@/types/face";
import CreateFaceModal from "./CreateFaceModal";

type Props = {
  initialFaces: Face[];
};

const FacesClient = ({ initialFaces }: Props) => {
  const [faces, setFaces] = useState<Face[]>(initialFaces);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (newFace: Face) => {
    setFaces((prev) => [newFace, ...prev]);
  };

  return (
    <main className="flex flex-col pb-6">
      {/* ページヘッダー */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-zinc-100">フェイス</h1>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-900/40 transition-all hover:bg-violet-500 hover:shadow-violet-700/50 active:scale-95 active:bg-violet-700"
          >
            <Plus size={14} aria-hidden="true" strokeWidth={2.5} />
            新規作成
          </button>
        </div>
      </header>

      <div className="px-4 pt-4">
        {faces.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            フェイスがありません
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {faces.map((face) => (
              <Link
                key={face.id}
                href={`/faces/${face.id}`}
                className="flex flex-col overflow-hidden rounded-xl bg-zinc-800/60 transition-colors hover:bg-zinc-700/80 active:bg-zinc-700"
              >
                {/* テーマ画像 or 絵文字フォールバック */}
                {face.imageUrl ? (
                  <div className="relative aspect-video w-full">
                    <Image
                      src={face.imageUrl}
                      alt={face.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-zinc-700/60">
                    {face.emoji && (
                      <span className="text-4xl leading-none" aria-hidden="true">
                        {face.emoji}
                      </span>
                    )}
                  </div>
                )}
                {/* カード本文 */}
                <div className="flex flex-col gap-1 p-3">
                  <div className="flex items-center gap-1.5">
                    {face.emoji && (
                      <span className="text-base leading-none" aria-hidden="true">
                        {face.emoji}
                      </span>
                    )}
                    <span className="truncate text-sm font-semibold text-zinc-100">
                      {face.name}
                    </span>
                  </div>
                  {face.description && (
                    <span className="line-clamp-2 text-xs text-zinc-400">
                      {face.description}
                    </span>
                  )}
                  {face.isPrivate && (
                    <span className="mt-0.5 self-start rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                      非公開
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateFaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </main>
  );
};

export default FacesClient;
