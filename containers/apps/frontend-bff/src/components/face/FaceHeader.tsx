'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { type Face } from '@/types/face';
import { useTranslations } from 'next-intl';
import FaceBadge from '@/components/ui/FaceBadge';
import { getFaceTitle, getFaceColor } from '@/lib/display';
import { subscribeAction, unsubscribeAction } from '@/server/actions/subscriptions';

export type SortOrder = 'newest' | 'oldest' | 'images';

type FaceHeaderProps = {
  face: Face;
  isOwner?: boolean;
  onSortChange?: (sort: SortOrder) => void;
  totalSeeds?: number;
  monthlySeeds?: number;
  subscriberCount?: number;
  isSubscribed?: boolean;
};

const FaceHeader = ({
  face,
  isOwner = false,
  onSortChange,
  totalSeeds = 0,
  monthlySeeds = 0,
  subscriberCount = 0,
  isSubscribed: initialSubscribed = false,
}: FaceHeaderProps) => {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [sort, setSort] = useState<SortOrder>('newest');
  const [isToggling, startToggleTransition] = useTransition();
  const t = useTranslations('face');
  const tHeader = useTranslations('faceHeader');

  const handleSubscribeToggle = () => {
    const next = !subscribed;
    setSubscribed(next);
    startToggleTransition(async () => {
      if (next) {
        await subscribeAction(face.id);
      } else {
        await unsubscribeAction(face.id);
      }
    });
  };

  const handleSort = (s: SortOrder) => {
    setSort(s);
    onSortChange?.(s);
  };

  const SORT_OPTIONS: { key: SortOrder; label: string }[] = [
    { key: 'newest', label: tHeader('newest') },
    { key: 'oldest', label: tHeader('oldest') },
    { key: 'images', label: tHeader('images') },
  ];

  return (
    <div>
      {face.imageUrl ? (
        /* カバー画像あり */
        <div style={{ position: 'relative', aspectRatio: '16/9', width: '100%' }}>
          <Image
            src={face.imageUrl}
            alt={face.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(20,24,36,0.80) 0%, rgba(20,24,36,0.35) 50%, transparent 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              textAlign: 'center',
            }}
          >
            <FaceBadge face={face} size={56} radius={15} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>
                {getFaceTitle(face)}
              </h1>
              {face.isPrivate && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(0,0,0,0.4)',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  {t('private')}
                </span>
              )}
            </div>
            {face.description && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', maxWidth: 320, margin: 0 }}>
                {face.description}
              </p>
            )}
            {!isOwner && (
              <button
                type="button"
                onClick={handleSubscribeToggle}
                disabled={isToggling}
                style={{
                  marginTop: 4,
                  padding: '8px 24px',
                  borderRadius: 999,
                  background: subscribed ? 'rgba(255,255,255,0.15)' : 'var(--mf-accent)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {subscribed ? t('subscribed') : t('subscribe')}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* カバー画像なし — face color グラデーションヒーロー */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '28px 24px 20px',
            textAlign: 'center',
            background: `linear-gradient(180deg, ${getFaceColor(face.id)}1A 0%, transparent 100%)`,
          }}
        >
          <FaceBadge face={face} size={56} radius={15} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--mf-brand)',
                margin: 0,
              }}
            >
              {getFaceTitle(face)}
            </h1>
            {face.isPrivate && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'var(--mf-surface-tint)',
                  fontSize: 11,
                  color: 'var(--mf-text-muted)',
                }}
              >
                {t('private')}
              </span>
            )}
          </div>
          {face.description && (
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: 'var(--mf-text-sub)',
                maxWidth: 320,
                margin: 0,
              }}
            >
              {face.description}
            </p>
          )}
          {!isOwner && (
            <button
              type="button"
              onClick={handleSubscribeToggle}
              disabled={isToggling}
              style={{
                padding: '8px 24px',
                borderRadius: 999,
                background: subscribed ? 'var(--mf-surface-tint)' : 'var(--mf-accent)',
                color: subscribed ? 'var(--mf-text-sub)' : '#fff',
                fontSize: 13,
                fontWeight: 700,
                border: subscribed ? '1px solid var(--mf-line)' : 'none',
                cursor: 'pointer',
              }}
            >
              {subscribed ? t('subscribed') : t('subscribe')}
            </button>
          )}
        </div>
      )}

      {/* 統計行 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '12px 24px',
          borderBottom: '0.5px solid var(--mf-line)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--mf-brand)' }}>
            {totalSeeds}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--mf-text-muted)', marginTop: 1 }}>
            {tHeader('seeds')}
          </div>
        </div>
        <div style={{ width: 0.5, height: 28, background: 'var(--mf-line)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--mf-brand)' }}>
            {monthlySeeds}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--mf-text-muted)', marginTop: 1 }}>
            {tHeader('monthly')}
          </div>
        </div>
        {!isOwner && (
          <>
            <div style={{ width: 0.5, height: 28, background: 'var(--mf-line)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--mf-brand)' }}>
                {subscriberCount}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--mf-text-muted)', marginTop: 1 }}>
                {tHeader('subscribers')}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ソートピル */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderBottom: '0.5px solid var(--mf-line)',
          overflowX: 'auto',
        }}
        className="mf-scroll"
      >
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleSort(key)}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: sort === key ? 700 : 400,
              background: sort === key ? 'var(--mf-brand)' : 'var(--mf-surface-tint)',
              color: sort === key ? '#fff' : 'var(--mf-text-sub)',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FaceHeader;
