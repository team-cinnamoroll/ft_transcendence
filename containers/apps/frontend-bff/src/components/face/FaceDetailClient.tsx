'use client';

import { useMemo, useState } from 'react';
import type { Face } from '@/types/face';
import type { Activity } from '@/types/activity';
import type { UserProfile } from '@/types/user-profile';
import FaceHeader, { type SortOrder } from './FaceHeader';
import FaceActivityFeed from './FaceActivityFeed';

const REFERENCE_MONTH = '2026-04';
const SUBSCRIBER_COUNT_MOCK = 12;

type Props = {
  face: Face;
  isOwner: boolean;
  activities: Activity[];
  users: UserProfile[];
  isSubscribed?: boolean;
};

const FaceDetailClient = ({ face, isOwner, activities, users, isSubscribed = false }: Props) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const totalSeeds = activities.length;
  const monthlySeeds = useMemo(
    () => activities.filter((a) => a.createdAt.startsWith(REFERENCE_MONTH)).length,
    [activities]
  );

  return (
    <>
      <FaceHeader
        face={face}
        isOwner={isOwner}
        onSortChange={setSortOrder}
        totalSeeds={totalSeeds}
        monthlySeeds={monthlySeeds}
        subscriberCount={SUBSCRIBER_COUNT_MOCK}
        isSubscribed={isSubscribed}
      />
      <section style={{ padding: '0 16px' }}>
        <FaceActivityFeed
          face={face}
          activities={activities}
          users={users}
          sortOrder={sortOrder}
        />
      </section>
    </>
  );
};

export default FaceDetailClient;
