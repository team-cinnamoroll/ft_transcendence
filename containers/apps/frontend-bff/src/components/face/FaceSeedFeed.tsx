'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type Face } from '@/types/face';
import type { Seed } from '@/types/seed';
import type { UserProfile } from '@/types/user-profile';
import SeedRow from '@/components/ui/SeedRow';
import { useTranslations } from 'next-intl';
import type { SortOrder } from './FaceHeader';

type FaceSeedFeedProps = {
  face: Face;
  seeds: Seed[];
  users?: UserProfile[];
  sortOrder?: SortOrder;
  currentUserId?: string;
  onSeedMoreOptions?: (e: React.MouseEvent<HTMLButtonElement>, seed: Seed) => void;
};

const FaceSeedFeed = ({
  face,
  seeds,
  sortOrder = 'newest',
  currentUserId,
  onSeedMoreOptions,
}: FaceSeedFeedProps) => {
  const t = useTranslations('faceSeedFeed');
  const router = useRouter();

  const sorted = useMemo(() => {
    if (sortOrder === 'oldest') return [...seeds].reverse();
    if (sortOrder === 'images') return seeds.filter((s) => (s.imageUrls?.length ?? 0) > 0);
    return seeds;
  }, [seeds, sortOrder]);

  if (sorted.length === 0) {
    return (
      <p
        style={{
          padding: '64px 0',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--mf-text-muted)',
        }}
      >
        {sortOrder === 'images' ? t('noImageSeeds') : t('noSeeds')}
      </p>
    );
  }

  return (
    <div style={{ padding: '0 28px' }}>
      {sorted.map((seed, index) => (
        <SeedRow
          key={seed.id}
          seed={seed}
          face={face}
          noBorder={index === sorted.length - 1}
          currentUserId={currentUserId}
          onMoreOptions={onSeedMoreOptions}
          onClick={() => router.push(`/seeds/${seed.id}`)}
        />
      ))}
    </div>
  );
};

export default FaceSeedFeed;
