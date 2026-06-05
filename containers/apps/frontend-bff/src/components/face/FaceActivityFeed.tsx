'use client';

import { useMemo } from 'react';
import { type Face } from '@/types/face';
import type { Activity } from '@/types/activity';
import type { UserProfile } from '@/types/user-profile';
import { useDetailPanel } from '@/lib/detail-panel-context';
import { createLookupMap, getFaceTitle } from '@/lib/display';
import UIActivityCard from '@/components/ui/ActivityCard';
import { useTranslations } from 'next-intl';
import type { SortOrder } from './FaceHeader';

type FaceActivityFeedProps = {
  face: Face;
  activities: Activity[];
  users: UserProfile[];
  sortOrder?: SortOrder;
};

const FaceActivityFeed = ({ face, activities, users, sortOrder = 'newest' }: FaceActivityFeedProps) => {
  const { openActivity } = useDetailPanel();
  const t = useTranslations('faceActivityFeed');

  const userMap = createLookupMap(users, (user) => user.id);
  const faceTitle = getFaceTitle(face);

  const sorted = useMemo(() => {
    if (sortOrder === 'oldest') return [...activities].reverse();
    if (sortOrder === 'images') return activities.filter((a) => (a.imageUrls?.length ?? 0) > 0);
    return activities;
  }, [activities, sortOrder]);

  if (sorted.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-500">
        {sortOrder === 'images' ? t('noImageActivities') : t('noActivities')}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((activity) => {
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
