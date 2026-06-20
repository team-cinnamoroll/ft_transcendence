'use client';

import { useEffect, useState, useTransition } from 'react';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { createLookupMap } from '@/lib/display';
import { useDetailPanel } from '@/lib/detail-panel-context';
import FaceHeader from '@/components/face/FaceHeader';
import SeedRow from './SeedRow';
import EditSeedModal from '@/components/seed/EditSeedModal';
import { deleteSeedAction } from '@/server/actions/seeds';
import { useTranslations } from 'next-intl';

type SeedActionMenu = { seed: Seed; top: number; right: number };

type FaceDetailProps = {
  faceId: string;
  onClose: () => void;
};

type FaceDetailApiResponse = {
  currentUser: UserProfile;
  face: Face | null;
  seeds: Seed[];
  users: UserProfile[];
};

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '0.5px solid var(--mf-line)',
  background: 'var(--mf-bg-light)',
  padding: '12px 16px',
};

const CloseButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    style={{
      width: 30,
      height: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--mf-text-muted)',
    }}
  >
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>
  </button>
);

const FaceDetail = ({ faceId, onClose }: FaceDetailProps) => {
  const t = useTranslations('faceDetail');
  const tSeed = useTranslations('seedActions');
  const { openSeed } = useDetailPanel();

  const [data, setData] = useState<FaceDetailApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [seedsOverride, setSeedsOverride] = useState<Seed[] | null>(null);
  const [seedActionMenu, setSeedActionMenu] = useState<SeedActionMenu | null>(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [deletingSeed, setDeletingSeed] = useState<Seed | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();
    setIsLoading(true);
    setData(null);

    void fetch(`/api/detail/face/${encodeURIComponent(faceId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch face detail: ${res.status}`);
        return (await res.json()) as FaceDetailApiResponse;
      })
      .then((json) => { if (isCurrent) setData(json); })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setData(null);
      })
      .finally(() => { if (isCurrent) setIsLoading(false); });

    return () => { isCurrent = false; controller.abort(); };
  }, [faceId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-text-muted)', margin: 0 }}>{t('title')}</h2>
          <CloseButton label={t('close')} onClick={onClose} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--mf-text-faint)' }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  const face = data?.face ?? null;
  const currentUser = data?.currentUser ?? null;
  const seeds = seedsOverride ?? (data?.seeds ?? []);
  const users = data?.users ?? [];
  const userMap = createLookupMap(users, (user) => user.id);

  const openSeedActionMenu = (e: React.MouseEvent<HTMLButtonElement>, seed: Seed) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight + 4 ? rect.bottom + 4 : rect.top - menuHeight - 4;
    setSeedActionMenu({ seed, top, right: window.innerWidth - rect.right });
  };

  const handleSeedUpdate = (updatedSeed: Seed) => {
    setSeedsOverride(seeds.map((s) => (s.id === updatedSeed.id ? updatedSeed : s)));
  };

  const handleConfirmSeedDelete = () => {
    if (!deletingSeed || isDeleting) return;
    const seedId = deletingSeed.id;
    startDeleteTransition(async () => {
      await deleteSeedAction(seedId);
      setSeedsOverride(seeds.filter((s) => s.id !== seedId));
      setDeletingSeed(null);
    });
  };

  if (!face || !currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-text-muted)', margin: 0 }}>{t('title')}</h2>
          <CloseButton label={t('close')} onClick={onClose} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--mf-text-faint)' }}>{t('notFound')}</p>
        </div>
      </div>
    );
  }

  const isOwner = face.userId === currentUser.id;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-text-muted)', margin: 0 }}>{t('title')}</h2>
          <CloseButton label={t('close')} onClick={onClose} />
        </div>

        <FaceHeader face={face} isOwner={isOwner} />

        <div style={{ borderBottom: '0.5px solid var(--mf-line)' }} />

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--mf-text-muted)' }}>
            {t('seedsHeading')}
          </p>
          {seeds.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--mf-text-faint)' }}>{t('noSeeds')}</p>
          ) : (
            seeds.map((seed, i) => {
              const seedUser = userMap.get(seed.userId);
              if (!seedUser) return null;
              return (
                <SeedRow
                  key={seed.id}
                  seed={seed}
                  face={face}
                  onClick={() => openSeed(seed.id)}
                  noBorder={i === seeds.length - 1}
                  currentUserId={currentUser.id}
                  onMoreOptions={openSeedActionMenu}
                />
              );
            })
          )}
        </div>
      </div>

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
              <p style={{ fontSize: 12, color: 'var(--mf-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {seedActionMenu.seed.body.slice(0, 30)}{seedActionMenu.seed.body.length > 30 ? '…' : ''}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => { setEditingSeed(seedActionMenu.seed); setSeedActionMenu(null); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', borderBottom: '0.5px solid var(--mf-line)', cursor: 'pointer', color: 'var(--mf-text)', textAlign: 'left' }}
            >
              <svg width={15} height={15} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
              </svg>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{tSeed('editSeed')}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => { setDeletingSeed(seedActionMenu.seed); setSeedActionMenu(null); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mf-danger, #e53e3e)', textAlign: 'left' }}
            >
              <svg width={15} height={15} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
          onUpdate={(updated) => { handleSeedUpdate(updated); setEditingSeed(null); }}
        />
      )}

      {/* 削除確認ダイアログ */}
      {deletingSeed && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,24,36,0.50)', backdropFilter: 'blur(4px)' }}
            onClick={() => { if (!isDeleting) setDeletingSeed(null); }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 50, width: 'calc(100% - 2rem)', maxWidth: 320, borderRadius: 18, background: 'var(--mf-bg-light)', border: '0.5px solid var(--mf-line)', boxShadow: '0 20px 60px rgba(30,42,74,0.18)', padding: '24px 20px 20px' }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--mf-brand)', margin: '0 0 8px' }}>{tSeed('deleteConfirmTitle')}</h2>
            <p style={{ fontSize: 13, color: 'var(--mf-text-sub)', margin: '0 0 20px', lineHeight: 1.6 }}>{tSeed('deleteConfirmMessage')}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeletingSeed(null)}
                disabled={isDeleting}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: '0.5px solid var(--mf-line)', background: 'none', color: 'var(--mf-text)', cursor: 'pointer' }}
              >
                {tSeed('deleteCancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSeedDelete}
                disabled={isDeleting}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: 'none', background: 'var(--mf-danger, #e53e3e)', color: '#fff', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}
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

export default FaceDetail;
