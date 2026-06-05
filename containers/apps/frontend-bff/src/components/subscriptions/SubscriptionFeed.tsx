'use client';

import Link from 'next/link';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import SeedRow from '@/components/ui/SeedRow';
import { createLookupMap } from '@/lib/display';
import { useTranslations } from 'next-intl';

type Props = {
  subscribedFaceIds: string[];
  subscribedActivities: Activity[];
  faces: Face[];
  users: UserProfile[];
};

const SubscriptionFeed = ({ subscribedFaceIds, subscribedActivities, faces, users }: Props) => {
  const t = useTranslations('subscriptionFeed');

  const faceMap = createLookupMap(
    faces.filter((face) => subscribedFaceIds.includes(face.id)),
    (face) => face.id
  );
  const userMap = createLookupMap(users, (user) => user.id);

  if (subscribedActivities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-4xl">🔔</p>
        <p className="text-sm text-zinc-400">{t('noSubscriptions')}</p>
        <Link
          href="/search"
          className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 active:bg-violet-700"
        >
          {t('searchLink')}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px' }}>
      {subscribedActivities.map((activity, index) => {
        const face = faceMap.get(activity.faceId);
        const user = userMap.get(activity.userId);
        if (!face || !user) return null;
        return (
          <SeedRow
            key={activity.id}
            activity={activity}
            face={face}

            noBorder={index === subscribedActivities.length - 1}
          />
        );
      })}
    </div>
  );
};

export default SubscriptionFeed;
