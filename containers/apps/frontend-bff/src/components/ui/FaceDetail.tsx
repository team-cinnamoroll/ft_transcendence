'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { User } from '@/types/user';
import { useDetailPanel } from '@/lib/detail-panel-context';
import { createLookupMap, getFaceTitle } from '@/lib/display';
import FaceHeader from '@/components/face/FaceHeader';
import ActivityCard from './ActivityCard';

type FaceDetailProps = {
  faceId: string;
};

type FaceDetailApiResponse = {
  currentUser: User;
  face: Face | null;
  activities: Activity[];
  users: User[];
};

const FaceDetail = ({ faceId }: FaceDetailProps) => {
  const { close, openActivity } = useDetailPanel();

  const [data, setData] = useState<FaceDetailApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();
    setIsLoading(true);
    setData(null);

    void fetch(`/api/detail/face/${encodeURIComponent(faceId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch face detail: ${res.status}`);
        }
        return (await res.json()) as FaceDetailApiResponse;
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
  }, [faceId]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-zinc-400">フェイス詳細</h2>
          <button
            type="button"
            aria-label="閉じる"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
          <p className="text-sm text-zinc-600">読み込み中…</p>
        </div>
      </div>
    );
  }

  const face = data?.face ?? null;
  const currentUser = data?.currentUser ?? null;
  const activities = data?.activities ?? [];
  const users = data?.users ?? [];

  const userMap = createLookupMap(users, (user) => user.id);

  if (!face || !currentUser) {
    return (
      <div className="flex flex-col h-full">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-zinc-400">フェイス詳細</h2>
          <button
            type="button"
            aria-label="閉じる"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
          <p className="text-sm text-zinc-600">フェイスが見つかりませんでした</p>
        </div>
      </div>
    );
  }

  const user = userMap.get(face.userId);
  const isOwner = face.userId === currentUser.id;
  const faceTitle = getFaceTitle(face) || face.name;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ヘッダー */}
      <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-zinc-400">フェイス詳細</h2>
        <button
          type="button"
          aria-label="閉じる"
          onClick={close}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <X size={16} />
        </button>
      </div>

      {/* FaceHeader（既存コンポーネントを流用） */}
      <FaceHeader face={face} isOwner={isOwner} />

      {/* 区切り */}
      <div className="border-b border-zinc-800" />

      {/* アクティビティ一覧 */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          このフェイスのアクティビティ
        </p>
        {activities.length === 0 ? (
          <p className="text-sm text-zinc-600">まだアクティビティがありません</p>
        ) : (
          activities.map((activity, i) => {
            const activityUser = userMap.get(activity.userId) ?? user;
            if (!activityUser) return null;

            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                user={activityUser}
                faceTitle={faceTitle}
                faceId={faceId}
                priority={i === 0}
                onClick={() => openActivity(activity.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default FaceDetail;
