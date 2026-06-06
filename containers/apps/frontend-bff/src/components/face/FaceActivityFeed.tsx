'use client';

import { useMemo } from 'react';
import { type Face } from '@/types/face';
import type { Activity } from '@/types/activity';
import type { UserProfile } from '@/types/user-profile';
import SeedRow from '@/components/ui/SeedRow';
import { useTranslations } from 'next-intl';
import type { SortOrder } from './FaceHeader';

type FaceActivityFeedProps = {
  face: Face;
  activities: Activity[];
  users?: UserProfile[];
  sortOrder?: SortOrder;
};

const FaceActivityFeed = ({ face, activities, sortOrder = 'newest' }: FaceActivityFeedProps) => {
  const t = useTranslations('faceActivityFeed');

  const sorted = useMemo(() => {
    if (sortOrder === 'oldest') return [...activities].reverse();
    if (sortOrder === 'images') return activities.filter((a) => (a.imageUrls?.length ?? 0) > 0);
    return activities;
  }, [activities, sortOrder]);

  if (sorted.length === 0) {
    return (
      <p style={{ padding: '64px 0', textAlign: 'center', fontSize: 13, color: 'var(--mf-text-muted)' }}>
        {sortOrder === 'images' ? t('noImageActivities') : t('noActivities')}
      </p>
    );
  }

  return (
    <div style={{ padding: '0 16px' }}>
      {sorted.map((activity, index) => (
        <SeedRow
          key={activity.id}
          activity={activity}
          face={face}
          noBorder={index === sorted.length - 1}
        />
      ))}
    </div>
  );
};

export default FaceActivityFeed;
