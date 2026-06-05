'use client';

import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { createLookupMap } from '@/lib/display';
import SeedRow from '@/components/ui/SeedRow';
import { useTranslations } from 'next-intl';

type ActivityFeedProps = {
  currentUser?: UserProfile;
  faces: Face[];
  activities: Activity[];
  selectedFaceId?: string | null;
};

const ActivityFeed = ({ faces, activities, selectedFaceId }: ActivityFeedProps) => {
  const t = useTranslations('activityFeed');
  const displayActivities = selectedFaceId
    ? activities.filter((a) => a.faceId === selectedFaceId)
    : activities;

  const faceCache = createLookupMap(faces, (face) => face.id);

  if (displayActivities.length === 0) {
    return <p className="text-center text-sm text-zinc-500 py-16">{t('noActivities')}</p>;
  }

  return (
    <div style={{ padding: '0 16px' }}>
      {displayActivities.map((activity, index) => {
        const face = faceCache.get(activity.faceId);
        if (!face) return null;
        return (
          <SeedRow
            key={activity.id}
            activity={activity}
            face={face}
            noBorder={index === displayActivities.length - 1}
          />
        );
      })}
    </div>
  );
};

export default ActivityFeed;
