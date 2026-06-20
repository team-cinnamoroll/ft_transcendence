'use client';

import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { createLookupMap } from '@/lib/display';
import SeedRow from '@/components/ui/SeedRow';
import { useTranslations } from 'next-intl';

type SeedFeedProps = {
  currentUser?: UserProfile;
  faces: Face[];
  seeds: Seed[];
  selectedFaceId?: string | null;
  currentUserId?: string;
  onSeedMoreOptions?: (e: React.MouseEvent<HTMLButtonElement>, seed: Seed) => void;
};

const SeedFeed = ({ faces, seeds, selectedFaceId, currentUserId, onSeedMoreOptions }: SeedFeedProps) => {
  const t = useTranslations('seedFeed');
  const displaySeeds = selectedFaceId
    ? seeds.filter((s) => s.faceId === selectedFaceId)
    : seeds;

  const faceCache = createLookupMap(faces, (face) => face.id);

  if (displaySeeds.length === 0) {
    return (
      <p
        style={{
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--mf-text-muted)',
          padding: '64px 0',
        }}
      >
        {t('noSeeds')}
      </p>
    );
  }

  return (
    <div>
      {displaySeeds.map((seed, index) => {
        const face = faceCache.get(seed.faceId);
        if (!face) return null;
        return (
          <SeedRow
            key={seed.id}
            seed={seed}
            face={face}
            noBorder={index === displaySeeds.length - 1}
            currentUserId={currentUserId}
            onMoreOptions={onSeedMoreOptions}
          />
        );
      })}
    </div>
  );
};

export default SeedFeed;
