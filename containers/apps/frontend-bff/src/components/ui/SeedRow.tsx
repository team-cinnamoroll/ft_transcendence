'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import { getFaceTitle } from '@/lib/display';
import { useRelativeTime } from '@/lib/use-relative-time';
import FaceBadge from '@/components/ui/FaceBadge';

type SeedRowProps = {
  seed: Seed;
  face: Face;
  handle?: string;
  onClick?: () => void;
  replyChain?: boolean;
  showActions?: boolean;
  noBorder?: boolean;
  currentUserId?: string;
  onMoreOptions?: (e: React.MouseEvent<HTMLButtonElement>, seed: Seed) => void;
};

const COLLAPSE_THRESHOLD = 200;

const SeedRow = ({
  seed,
  face,
  handle,
  onClick,
  replyChain = false,
  noBorder = false,
  currentUserId,
  onMoreOptions,
}: SeedRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations('seedRow');
  const formatRelative = useRelativeTime();

  const isLong = seed.body.length > COLLAPSE_THRESHOLD;
  const displayBody =
    isLong && !expanded ? seed.body.slice(0, COLLAPSE_THRESHOLD) + '…' : seed.body;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{
        padding: '14px 0',
        borderBottom: noBorder ? 'none' : '0.5px solid var(--mf-line-soft)',
        display: 'flex',
        gap: 12,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <FaceBadge face={face} size={36} radius={10} />
        {replyChain && (
          <div
            style={{
              width: 2,
              flex: 1,
              background: 'var(--mf-line-soft)',
              marginTop: 6,
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--mf-font-sans)',
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--mf-brand)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 1,
            }}
          >
            {getFaceTitle(face)}
          </span>
          {handle && (
            <span style={{ fontSize: 12, color: 'var(--mf-text-muted)', flexShrink: 0 }}>
              @{handle}
            </span>
          )}
          <span style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', flexShrink: 0 }}>·</span>
          <span style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', flexShrink: 0 }}>
            {formatRelative(seed.createdAt)}
          </span>
          {onMoreOptions && currentUserId === seed.userId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoreOptions(e, seed);
              }}
              aria-label={t('moreOptions')}
              style={{
                marginLeft: 'auto',
                flexShrink: 0,
                width: 24,
                height: 24,
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
              <svg width={3} height={13} viewBox="0 0 3 13" fill="currentColor">
                <circle cx={1.5} cy={1.5} r={1.5} />
                <circle cx={1.5} cy={6.5} r={1.5} />
                <circle cx={1.5} cy={11.5} r={1.5} />
              </svg>
            </button>
          )}
        </div>

        <div
          style={{
            fontFamily: 'var(--mf-font-sans)',
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--mf-ink)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {displayBody}
        </div>

        {isLong && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            style={{
              marginTop: 4,
              fontSize: 12.5,
              color: 'var(--mf-accent)',
              fontFamily: 'var(--mf-font-sans)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {expanded ? t('collapse') : t('readMore')}
          </button>
        )}

        {seed.images.length > 0 && (
          <div
            style={{
              marginTop: 10,
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(seed.images.length, 2)}, 1fr)`,
              gap: 3,
              borderRadius: 14,
              overflow: 'hidden',
              border: '0.5px solid var(--mf-line-soft)',
              maxWidth: '50%',
            }}
          >
            {seed.images.slice(0, 4).map((image, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  aspectRatio: seed.images.length === 1 ? '16/10' : '1/1',
                }}
              >
                <Image
                  src={image.url}
                  alt={t('imageAlt', { n: i + 1 })}
                  fill
                  className="object-cover"
                  sizes="(max-width: 384px) 100vw, 192px"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeedRow;
