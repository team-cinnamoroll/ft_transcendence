'use client';

import { useMemo, useState, useTransition } from 'react';
import type { Face } from '@/types/face';
import type { Seed } from '@/types/seed';
import type { UserProfile } from '@/types/user-profile';
import { useTranslations } from 'next-intl';
import FaceHeader, { type SortOrder } from './FaceHeader';
import FaceSeedFeed from './FaceSeedFeed';
import EditSeedModal from '@/components/seed/EditSeedModal';
import { deleteSeedAction } from '@/server/actions/seeds';
import { useSubscribeSeedCreated } from '@/lib/seed-created-provider';

const REFERENCE_MONTH = '2026-04';

type SeedActionMenu = { seed: Seed; top: number; right: number };

type Props = {
  face: Face;
  currentUserId: string;
  linkableCurrentUser: UserProfile;
  seeds: Seed[];
  users: UserProfile[];
};

const FaceDetailClient = ({
  face,
  currentUserId,
  linkableCurrentUser,
  seeds: initialSeeds,
  users,
}: Props) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [seeds, setSeeds] = useState<Seed[]>(initialSeeds);
  const [seedActionMenu, setSeedActionMenu] = useState<SeedActionMenu | null>(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [deletingSeed, setDeletingSeed] = useState<Seed | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const tSeed = useTranslations('seedActions');

  useSubscribeSeedCreated((seed) => {
    if (seed.faceId !== face.id) return;
    setSeeds((prev) => [seed, ...prev]);
  });

  const totalSeeds = seeds.length;
  const monthlySeeds = useMemo(
    () => seeds.filter((a) => a.createdAt.startsWith(REFERENCE_MONTH)).length,
    [seeds]
  );

  const openSeedActionMenu = (e: React.MouseEvent<HTMLButtonElement>, seed: Seed) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight + 4 ? rect.bottom + 4 : rect.top - menuHeight - 4;
    setSeedActionMenu({ seed, top, right: window.innerWidth - rect.right });
  };

  const handleSeedUpdate = (updatedSeed: Seed) => {
    setSeeds((prev) => prev.map((s) => (s.id === updatedSeed.id ? updatedSeed : s)));
  };

  const handleConfirmSeedDelete = () => {
    if (!deletingSeed || isDeleting) return;
    const seedId = deletingSeed.id;
    startDeleteTransition(async () => {
      await deleteSeedAction(seedId);
      setSeeds((prev) => prev.filter((s) => s.id !== seedId));
      setDeletingSeed(null);
    });
  };

  return (
    <>
      <div style={{ borderBottom: '0.5px solid var(--mf-line)' }}>
        <FaceHeader
          face={face}
          onSortChange={setSortOrder}
          totalSeeds={totalSeeds}
          monthlySeeds={monthlySeeds}
        />
      </div>
      <section>
        <FaceSeedFeed
          face={face}
          seeds={seeds}
          users={users}
          linkableCurrentUser={linkableCurrentUser}
          sortOrder={sortOrder}
          currentUserId={currentUserId}
          onSeedMoreOptions={openSeedActionMenu}
        />
      </section>

      {/* アクションドロップダウン */}
      {seedActionMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setSeedActionMenu(null)}
            aria-hidden="true"
          />
          <div
            role="menu"
            style={{
              position: 'fixed',
              top: seedActionMenu.top,
              right: seedActionMenu.right,
              zIndex: 50,
              minWidth: 180,
              borderRadius: 12,
              background: 'var(--mf-bg-light)',
              border: '0.5px solid var(--mf-line)',
              boxShadow: '0 8px 32px rgba(30,42,74,0.18)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 16px 8px', borderBottom: '0.5px solid var(--mf-line)' }}>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--mf-text-muted)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}
              >
                {seedActionMenu.seed.body.slice(0, 30)}
                {seedActionMenu.seed.body.length > 30 ? '…' : ''}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setEditingSeed(seedActionMenu.seed);
                setSeedActionMenu(null);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: '0.5px solid var(--mf-line)',
                cursor: 'pointer',
                color: 'var(--mf-text)',
                textAlign: 'left',
              }}
            >
              <svg
                width={15}
                height={15}
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
              </svg>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{tSeed('editSeed')}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDeletingSeed(seedActionMenu.seed);
                setSeedActionMenu(null);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--mf-danger, #e53e3e)',
                textAlign: 'left',
              }}
            >
              <svg
                width={15}
                height={15}
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3.5h10M5.5 3.5V2h3v1.5M3.5 3.5l.7 8h5.6l.7-8" />
              </svg>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{tSeed('deleteSeed')}</span>
            </button>
          </div>
        </>
      )}

      {/* 編集モーダル */}
      {editingSeed && (
        <EditSeedModal
          isOpen={true}
          seed={editingSeed}
          onClose={() => setEditingSeed(null)}
          onUpdate={(updated) => {
            handleSeedUpdate(updated);
            setEditingSeed(null);
          }}
        />
      )}

      {/* 削除確認ダイアログ */}
      {deletingSeed && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(20,24,36,0.50)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => {
              if (!isDeleting) setDeletingSeed(null);
            }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 50,
              width: 'calc(100% - 2rem)',
              maxWidth: 320,
              borderRadius: 18,
              background: 'var(--mf-bg-light)',
              border: '0.5px solid var(--mf-line)',
              boxShadow: '0 20px 60px rgba(30,42,74,0.18)',
              padding: '24px 20px 20px',
            }}
          >
            <h2
              style={{ fontSize: 15, fontWeight: 700, color: 'var(--mf-brand)', margin: '0 0 8px' }}
            >
              {tSeed('deleteConfirmTitle')}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--mf-text-sub)',
                margin: '0 0 20px',
                lineHeight: 1.6,
              }}
            >
              {tSeed('deleteConfirmMessage')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeletingSeed(null)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  border: '0.5px solid var(--mf-line)',
                  background: 'none',
                  color: 'var(--mf-text)',
                  cursor: 'pointer',
                }}
              >
                {tSeed('deleteCancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSeedDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  border: 'none',
                  background: 'var(--mf-danger, #e53e3e)',
                  color: '#fff',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? tSeed('deleting') : tSeed('deleteConfirmButton')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FaceDetailClient;
