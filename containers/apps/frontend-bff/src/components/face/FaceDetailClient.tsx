'use client';

import { useState } from 'react';
import type { Face } from '@/types/face';
import type { Activity } from '@/types/activity';
import type { UserProfile } from '@/types/user-profile';
import FaceHeader, { type SortOrder } from './FaceHeader';
import FaceActivityFeed from './FaceActivityFeed';

type Props = {
  face: Face;
  isOwner: boolean;
  activities: Activity[];
  users: UserProfile[];
};

const FaceDetailClient = ({ face, isOwner, activities, users }: Props) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  return (
    <>
      <div style={{ borderBottom: '0.5px solid var(--mf-line)' }}>
        <FaceHeader face={face} isOwner={isOwner} onSortChange={setSortOrder} />
      </div>
      <section className="p-4">
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
