'use client';

import { useState, useTransition } from 'react';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { useTranslations } from 'next-intl';
import FaceFilterBar from './FaceFilterBar';
import SeedFeed from './SeedFeed';
import FaceChip from '@/components/ui/FaceChip';
import FaceBadge from '@/components/ui/FaceBadge';
import PostModal from '@/components/ui/PostModal';
import EditSeedModal from '@/components/seed/EditSeedModal';
import { deleteSeedAction } from '@/server/actions/seeds';
import { getFaceTitle } from '@/lib/display';

type SeedActionMenu = { seed: Seed; top: number; right: number };

type Props = {
  currentUser: UserProfile;
  faces: Face[];
  seeds: Seed[];
  onThisDay?: Seed;
  onThisDayFace?: Face;
  yearsAgo?: number;
  dateLabel?: string;
};

const HomeClient = ({
  currentUser,
  faces,
  seeds: initialSeeds,
  onThisDay,
  onThisDayFace,
  yearsAgo,
  dateLabel,
}: Props) => {
  const [seeds, setSeeds] = useState<Seed[]>(initialSeeds);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seedActionMenu, setSeedActionMenu] = useState<SeedActionMenu | null>(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [deletingSeed, setDeletingSeed] = useState<Seed | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const t = useTranslations('homeClient');
  const tSeed = useTranslations('seedActions');

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

  const defaultFace = faces[0] ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* モバイル専用タイトル */}
      <div className="md:hidden" style={{ padding: '4px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div
            style={{ fontSize: 22, fontWeight: 700, color: 'var(--mf-brand)', letterSpacing: -0.3 }}
          >
            {t('write')}
          </div>
          {dateLabel && (
            <div style={{ fontSize: 12, color: 'var(--mf-text-sub)', fontWeight: 500 }}>
              {dateLabel}
            </div>
          )}
        </div>
      </div>

      {/* On This Day（PC は ContextRail が担当するため lg:hidden） */}
      {onThisDay && onThisDayFace && (
        <div className="lg:hidden" style={{ padding: '14px 18px 0' }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: 'var(--mf-surface)',
              border: '0.5px solid var(--mf-line)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--mf-text-muted)',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                }}
              >
                {t('onThisDay')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--mf-text-muted)' }}>
                {t('yearsAgo', { n: yearsAgo ?? 0 })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <FaceChip faceId={onThisDayFace.id} title={getFaceTitle(onThisDayFace)} />
              <span style={{ fontSize: 10.5, color: 'var(--mf-text-muted)' }}>
                {onThisDay.createdAt.slice(0, 10).replace(/-/g, '.')}
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: 'var(--mf-ink)',
                margin: 0,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {onThisDay.body}
            </p>
            <p
              style={{
                marginTop: 8,
                fontSize: 11,
                color: 'var(--mf-text-muted)',
                fontStyle: 'italic',
                margin: '8px 0 0',
              }}
            >
              {t('reply')}
            </p>
          </div>
        </div>
      )}

      {/* PC版コンポーズバー（モバイルは MobileComposeBar が担当） */}
      <div className="hidden md:block" style={{ padding: '14px 18px 0' }}>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 14,
            background: 'var(--mf-surface)',
            border: '0.5px solid var(--mf-line)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {defaultFace && <FaceBadge face={defaultFace} size={30} radius={8} />}
          <span
            style={{
              flex: 1,
              fontSize: 14,
              color: 'var(--mf-text-faint)',
              fontFamily: 'var(--mf-font-sans)',
            }}
          >
            {t('compose')}
          </span>
          <span
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              background: 'var(--mf-accent)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {t('post')}
          </span>
        </button>
      </div>

      {/* 最近のシード セクションヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '20px 18px 4px',
        }}
      >
        <span
          style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: 0.2, color: 'var(--mf-brand)' }}
        >
          {t('recentSeeds')}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>{t('viewAll')}</span>
      </div>

      <FaceFilterBar faces={faces} selectedFaceId={selectedFaceId} onSelect={setSelectedFaceId} />

      <div style={{ padding: '0 28px' }}>
        <SeedFeed
          faces={faces}
          seeds={seeds}
          selectedFaceId={selectedFaceId}
          currentUserId={currentUser.id}
          onSeedMoreOptions={openSeedActionMenu}
        />
      </div>

      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={(seed) => setSeeds((prev) => [seed, ...prev])}
      />

      {/* シードアクションドロップダウン */}
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

      {/* シード編集モーダル */}
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

      {/* シード削除確認モーダル */}
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
    </div>
  );
};

export default HomeClient;
