'use client';

import Image from 'next/image';
import { useState } from 'react';
import { type Face } from '@/types/face';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export type SortOrder = 'newest' | 'oldest' | 'images';

type FaceHeaderProps = {
  face: Face;
  isOwner?: boolean;
  onSortChange?: (sort: SortOrder) => void;
};

const FaceHeader = ({ face, isOwner = false, onSortChange }: FaceHeaderProps) => {
  const [subscribed, setSubscribed] = useState(false);
  const [sort, setSort] = useState<SortOrder>('newest');
  const t = useTranslations('face');
  const tHeader = useTranslations('faceHeader');

  const handleSort = (s: SortOrder) => {
    setSort(s);
    onSortChange?.(s);
  };

  const SORT_OPTIONS: { key: SortOrder; label: string }[] = [
    { key: 'newest', label: tHeader('newest') },
    { key: 'oldest', label: tHeader('oldest') },
    { key: 'images', label: tHeader('images') },
  ];

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
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
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
                  {t('private')}
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
                  'mt-1 rounded-full px-6 py-2 text-sm font-semibold transition-colors',
                  subscribed
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
                )}
              >
                {subscribed ? t('subscribed') : t('subscribe')}
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
                  {t('private')}
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
                  'rounded-full px-6 py-2 text-sm font-semibold transition-colors',
                  subscribed
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
                )}
              >
                {subscribed ? t('subscribed') : t('subscribe')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ソートピル */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 border-b border-zinc-800 mf-scroll">
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleSort(key)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1 text-xs font-medium transition-colors whitespace-nowrap',
              sort === key
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FaceHeader;
