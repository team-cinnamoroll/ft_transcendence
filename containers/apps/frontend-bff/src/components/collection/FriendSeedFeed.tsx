'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { useTranslations } from 'next-intl';
import SeedRow from '@/components/ui/SeedRow';
import Pagination from '@/components/ui/Pagination';
import { createLookupMap } from '@/lib/display';

type Props = {
  seeds: Seed[];
  faces: Face[];
  users: UserProfile[];
};

const PAGE_SIZE = 10;

const FriendSeedFeed = ({ seeds, faces, users }: Props) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const t = useTranslations('collection');

  const faceMap = useMemo(() => createLookupMap(faces, (face) => face.id), [faces]);
  const userMap = useMemo(() => createLookupMap(users, (user) => user.id), [users]);

  const totalPages = Math.ceil(seeds.length / PAGE_SIZE);
  const pagedSeeds = seeds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (seeds.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '80px 20px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>{t('empty')}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '20px 18px 10px' }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
          {t('title')}
        </p>
      </div>
      <div style={{ padding: '0 28px' }}>
        {pagedSeeds.map((seed) => {
          const face = faceMap.get(seed.faceId);
          if (!face) return null;
          return (
            <SeedRow
              key={seed.id}
              seed={seed}
              face={face}
              author={userMap.get(seed.userId)}
              onClick={() => router.push(`/seeds/${seed.id}`)}
            />
          );
        })}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default FriendSeedFeed;
