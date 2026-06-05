'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getFaceTitle } from '@/lib/display';
import Avatar from './Avatar';
import Badge from './Badge';
import FaceChip from './FaceChip';
import { cn } from '@/lib/utils';
import { useRelativeTime } from '@/lib/use-relative-time';
import { useTranslations } from 'next-intl';

type ActivityDetailProps = {
  activityId: string;
  onClose: () => void;
};

type ActivityDetailApiResponse = {
  activity: Activity | null;
  user: UserProfile | null;
  face: Face | null;
};

const ActivityDetail = ({ activityId, onClose }: ActivityDetailProps) => {
  const t = useTranslations('activityDetail');
  const relativeTime = useRelativeTime();

  const [data, setData] = useState<ActivityDetailApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();
    setIsLoading(true);
    setData(null);

    void fetch(`/api/detail/activity/${encodeURIComponent(activityId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch activity detail: ${res.status}`);
        }
        return (await res.json()) as ActivityDetailApiResponse;
      })
      .then((json) => {
        if (!isCurrent) return;
        setData(json);
      })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setData(null);
      })
      .finally(() => {
        if (!isCurrent) return;
        setIsLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [activityId]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-zinc-400">{t('title')}</h2>
          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
          <p className="text-sm text-zinc-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const activity = data?.activity ?? null;
  const face = data?.face ?? null;
  const user = data?.user ?? null;

  if (!activity || !user) {
    return (
      <div className="flex flex-col h-full">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-zinc-400">{t('title')}</h2>
          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
          <p className="text-sm text-zinc-600">{t('notFound')}</p>
        </div>
      </div>
    );
  }

  const resolvedFaceTitle = face ? getFaceTitle(face) : '';
  const faceTitle = resolvedFaceTitle || activity.faceId || t('unknownFace');
  const formattedTime = relativeTime(activity.createdAt);

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-zinc-400">{t('title')}</h2>
        <button
          type="button"
          aria-label={t('close')}
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <X size={16} />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="px-4 py-4 flex flex-col gap-4 overflow-y-auto">
        {/* ユーザー・フェイス行 */}
        <div className="flex items-start gap-3">
          <Avatar src={user.avatarUrl} alt={user.name} size="md" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
              <span>{user.name}</span>
              {user.badge && <Badge emoji={user.badge} />}
            </div>
            <div className="flex items-center gap-2">
              <FaceChip title={faceTitle} faceId={activity.faceId} />
              <time dateTime={activity.createdAt} className="text-xs text-zinc-500">
                {formattedTime}
              </time>
            </div>
          </div>
        </div>

        {/* 本文（全文展開・折りたたみなし） */}
        <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">{activity.body}</p>

        {/* 画像グリッド */}
        {activity.imageUrls && activity.imageUrls.length > 0 && (
          <div
            className={cn(
              'grid gap-1.5 overflow-hidden rounded-xl',
              activity.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            )}
          >
            {activity.imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={url}
                  alt={t('imageAlt', { n: i + 1 })}
                  fill
                  className="object-cover"
                  sizes="(max-width: 384px) 100vw, 192px"
                />
              </div>
            ))}
          </div>
        )}

        {/* フェイスへのリンク */}
        <Link
          href={`/faces/${activity.faceId}`}
          className="mt-2 self-start text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          {t('viewFace')}
        </Link>
      </div>
    </div>
  );
};

export default ActivityDetail;
