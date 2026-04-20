'use client';

import { type Face } from '@/types/face';
import type { Activity } from '@/types/activity';
import type { User } from '@/types/user';
import { useDetailPanel } from '@/lib/detail-panel-context';
import { createLookupMap, getFaceTitle } from '@/lib/display';
import UIActivityCard from '@/components/ui/ActivityCard';

type FaceActivityFeedProps = {
  face: Face;
  activities: Activity[];
  users: User[];
};

/**
 * 指定フェイスに属するアクティビティを時系列降順で表示するフィード。
 */
const FaceActivityFeed = ({ face, activities, users }: FaceActivityFeedProps) => {
  const { openActivity } = useDetailPanel();

  const userMap = createLookupMap(users, (user) => user.id);
  const faceTitle = getFaceTitle(face);

  if (activities.length === 0) {
    return <p className="py-16 text-center text-sm text-zinc-500">アクティビティがありません</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {activities.map((activity) => {
        const user = userMap.get(activity.userId);
        if (!user) return null;
        return (
          <li key={activity.id}>
            <UIActivityCard
              activity={activity}
              user={user}
              faceTitle={faceTitle}
              faceId={face.id}
              onClick={() => openActivity(activity.id)}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default FaceActivityFeed;
