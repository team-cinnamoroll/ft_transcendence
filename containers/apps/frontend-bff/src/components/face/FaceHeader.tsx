"use client";

import Image from "next/image";
import { useState } from "react";
import { type Face } from "@/types/face";
import { cn } from "@/lib/utils";

type FaceHeaderProps = {
  face: Face;
  isOwner?: boolean;
};

const FaceHeader = ({ face, isOwner = false }: FaceHeaderProps) => {
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    setSubscribed((prev) => !prev);
  };

  return (
    <div className="flex flex-col">
      {face.imageUrl ? (
        /* カバー画像あり: 画像 + グラデーションオーバーレイ */
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={face.imageUrl}
            alt={face.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* グラデーションオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          {/* コンテンツ（画像上に重ねる） */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 py-6 text-center">
            {face.emoji && (
              <span className="text-5xl leading-none" aria-hidden="true">
                {face.emoji}
              </span>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{face.name}</h1>
              {face.isPrivate && (
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs text-white/80">
                  非公開
                </span>
              )}
            </div>
            {face.description && (
              <p className="max-w-xs text-sm text-white/80">{face.description}</p>
            )}
            {!isOwner && (
              <button
                type="button"
                onClick={handleSubscribe}
                className={cn(
                  "mt-1 rounded-full px-6 py-2 text-sm font-semibold transition-colors",
                  subscribed
                    ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                    : "bg-violet-600 text-white hover:bg-violet-500",
                )}
              >
                {subscribed ? "✓ サブスク中" : "サブスクする"}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* カバー画像なし: 従来どおり */
        <div className="flex flex-col gap-4 px-4 py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            {face.emoji && (
              <span className="text-5xl leading-none" aria-hidden="true">
                {face.emoji}
              </span>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-100">{face.name}</h1>
              {face.isPrivate && (
                <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                  非公開
                </span>
              )}
            </div>
            {face.description && (
              <p className="max-w-xs text-sm text-zinc-400">{face.description}</p>
            )}
          </div>
          {!isOwner && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSubscribe}
                className={cn(
                  "rounded-full px-6 py-2 text-sm font-semibold transition-colors",
                  subscribed
                    ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                    : "bg-violet-600 text-white hover:bg-violet-500",
                )}
              >
                {subscribed ? "✓ サブスク中" : "サブスクする"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FaceHeader;
