"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type Activity } from "@/types/activity";
import { type User } from "@/types/user";
import Avatar from "./Avatar";
import Badge from "./Badge";
import FaceChip from "./FaceChip";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { useDetailPanel } from "@/lib/detail-panel-context";

type ActivityCardProps = {
  activity: Activity;
  user: User;
  faceTitle: string;
  /** フェイスチップの色決定に使用 */
  faceId: string;
  /** true のとき最初の画像を優先読み込み（LCP 対策） */
  priority?: boolean;
  className?: string;
  /** クリック時のコールバック（DetailPanel 連携用） */
  onClick?: () => void;
};

const COLLAPSE_THRESHOLD = 200;

const ActivityCard = ({
  activity,
  user,
  faceTitle,
  faceId,
  priority = false,
  className,
  onClick,
}: ActivityCardProps) => {
  const { state } = useDetailPanel();
  const isSelected = state.type === "activity" && state.activityId === activity.id;

  const isLong = activity.body.length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(false);

  const displayBody =
    isLong && !expanded
      ? activity.body.slice(0, COLLAPSE_THRESHOLD) + "…"
      : activity.body;

  const canOpenDetail = Boolean(onClick);

  const isDesktopViewport = () => {
    return typeof window !== "undefined" && window.innerWidth >= 768;
  };

  const handleCardClick = () => {
    if (onClick && isDesktopViewport()) {
      onClick();
    }
  };

  return (
    <article
      onClick={handleCardClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        canOpenDetail
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            }
          : undefined
      }
      className={cn(
        "flex flex-col gap-3 rounded-2xl p-4 transition duration-200",
        // 基本スタイル（通常時のホバー等のアニメーション）
        !isSelected && "bg-zinc-800/60 hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99]",
        // PCクリック用
        canOpenDetail && "md:cursor-pointer",
        // 選択時スタイル: 【3. 背景全体を薄い紫に】
        isSelected && "bg-violet-950/60 scale-[1.01]",
        className,
      )}
    >
      {/* ヘッダー: アバター・名前・バッジ・フェイス・日時 */}
      <div className="flex items-start gap-3">
        <Avatar src={user.avatarUrl} alt={user.name} size="md" />
        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
            <span className="truncate">{user.name}</span>
            {user.badge && <Badge emoji={user.badge} />}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/faces/${faceId}`} onClick={(e) => e.stopPropagation()}>
              <FaceChip
                title={faceTitle}
                faceId={faceId}
                className="transition-opacity hover:opacity-80"
              />
            </Link>
            <time
              dateTime={activity.createdAt}
              className="text-xs text-zinc-500"
            >
              {formatRelativeTime(activity.createdAt)}
            </time>
          </div>
        </div>
      </div>

      {/* 本文 */}
      <div className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
        {displayBody}
      </div>

      {/* 「もっと見る」 */}
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
          className="self-start text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          {expanded ? "折りたたむ" : "もっと見る"}
        </button>
      )}

      {/* 画像 */}
      {activity.imageUrls && activity.imageUrls.length > 0 && (
        <div
          className={cn(
            "grid gap-1.5 overflow-hidden rounded-xl",
            activity.imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {activity.imageUrls.map((url, i) => (
            <div key={i} className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={url}
                alt={`画像 ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 384px) 100vw, 192px"
                priority={priority && i === 0}
                loading={priority && i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

export default ActivityCard;
