'use client';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { createLookupMap } from '@/lib/display';
import SeedRow from '@/components/ui/SeedRow';
import { useTranslations } from 'next-intl';

type ActivityFeedProps = {
  currentUser?: UserProfile;
  faces: Face[];
  activities: Seed[];
  selectedFaceId?: string | null;
};

const ActivityFeed = ({ faces, activities, selectedFaceId }: ActivityFeedProps) => {
  const t = useTranslations('activityFeed');
  const displayActivities = selectedFaceId
    ? activities.filter((a) => a.faceId === selectedFaceId)
    : activities;

  const faceCache = createLookupMap(faces, (face) => face.id);

  if (displayActivities.length === 0) {
    return (
      <p
        style={{
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--mf-text-muted)',
          padding: '64px 0',
        }}
      >
        {t('noActivities')}
      </p>
    );
  }

  return (
    <div>
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
