'use client';

import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { User } from '@/types/user';
import { useDetailPanel } from '@/lib/detail-panel-context';
import { createLookupMap, getFaceTitle } from '@/lib/display';
import ActivityCard from '@/components/ui/ActivityCard';

type ActivityFeedProps = {
  currentUser: User;
  faces: Face[];
  activities: Activity[];
  /** フィルタするフェイス ID。null のときは全フェイスを表示 */
  selectedFaceId?: string | null;
};

/**
 * ホームフィード。
 * currentUser のアクティビティを時系列降順（最新が先頭）で表示する。
 * selectedFaceId が指定されている場合は該当フェイスのみに絞り込む。
 */
const ActivityFeed = ({ currentUser, faces, activities, selectedFaceId }: ActivityFeedProps) => {
  const { openActivity } = useDetailPanel();
  const displayActivities = selectedFaceId
    ? activities.filter((a) => a.faceId === selectedFaceId)
    : activities;

  const faceCache = createLookupMap(faces, (face) => face.id);

  if (displayActivities.length === 0) {
    return <p className="text-center text-sm text-zinc-500 py-16">アクティビティがありません</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {displayActivities.map((activity, index) => {
        const face = faceCache.get(activity.faceId);
        if (!face) return null;
        return (
          <li key={activity.id}>
            <ActivityCard
              activity={activity}
              user={currentUser}
              faceTitle={getFaceTitle(face)}
              faceId={face.id}
              priority={index === 0}
              onClick={() => openActivity(activity.id)}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default ActivityFeed;
