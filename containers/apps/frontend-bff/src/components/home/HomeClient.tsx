'use client';

import { useState } from 'react';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { useTranslations } from 'next-intl';
import FaceFilterBar from './FaceFilterBar';
import SeedFeed from './SeedFeed';
import FaceChip from '@/components/ui/FaceChip';
import FaceBadge from '@/components/ui/FaceBadge';
import PostModal from '@/components/ui/PostModal';
import { getFaceTitle } from '@/lib/display';

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
  currentUser: _currentUser,
  faces,
  seeds,
  onThisDay,
  onThisDayFace,
  yearsAgo,
  dateLabel,
}: Props) => {
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations('homeClient');

  const defaultFace = faces[0] ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* モバイル専用タイトル */}
      <div className="md:hidden" style={{ padding: '4px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--mf-brand)', letterSpacing: -0.3 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mf-text-muted)', letterSpacing: 0.6, textTransform: 'uppercase' }}>
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
            <p style={{ marginTop: 8, fontSize: 11, color: 'var(--mf-text-muted)', fontStyle: 'italic', margin: '8px 0 0' }}>
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
        <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: 0.2, color: 'var(--mf-brand)' }}>
          {t('recentSeeds')}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>
          {t('viewAll')}
        </span>
      </div>

      <FaceFilterBar faces={faces} selectedFaceId={selectedFaceId} onSelect={setSelectedFaceId} />

      <div style={{ padding: '0 28px' }}>
        <SeedFeed faces={faces} seeds={seeds} selectedFaceId={selectedFaceId} />
      </div>

      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default HomeClient;
