'use client';

import Link from 'next/link';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { User } from '@/types/user';
import ActivityCard from '@/components/ui/ActivityCard';
import { useDetailPanel } from '@/lib/detail-panel-context';
import { createLookupMap, getFaceTitle } from '@/lib/display';

/**
 * サブスク画面フィード。
 * currentUser がサブスクライブしているフェイスのアクティビティを
 * 時系列降順（最新が先頭）で表示する。
 *
 * 各カードには「誰の・何のフェイスの投稿か」を明示する。
 */
type Props = {
  subscribedFaceIds: string[];
  subscribedActivities: Activity[];
  faces: Face[];
  users: User[];
};

const SubscriptionFeed = ({ subscribedFaceIds, subscribedActivities, faces, users }: Props) => {
  const { openActivity } = useDetailPanel();

  // O(1) で引けるようにマップ化
  const faceMap = createLookupMap(
    faces.filter((face) => subscribedFaceIds.includes(face.id)),
    (face) => face.id
  );
  const userMap = createLookupMap(users, (user) => user.id);

  if (subscribedActivities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-4xl">🔔</p>
        <p className="text-sm text-zinc-400">まだサブスクしているフェイスがありません</p>
        <Link
          href="/search"
          className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 active:bg-violet-700"
        >
          検索してフェイスを探す
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {subscribedActivities.map((activity) => {
        const face = faceMap.get(activity.faceId);
        const user = userMap.get(activity.userId);
        if (!face || !user) return null;
        return (
          <li key={activity.id}>
            <ActivityCard
              activity={activity}
              user={user}
              faceTitle={getFaceTitle(face)}
              faceId={face.id}
              onClick={() => openActivity(activity.id)}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default SubscriptionFeed;
