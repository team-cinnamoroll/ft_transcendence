'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import type { SeedLink } from '@/server/usecases/seeds';
import { getFaceTitle, getFaceColor, getAvatarUrl } from '@/lib/display';
import { useRelativeTime } from '@/lib/use-relative-time';
import FaceBadge from '@/components/ui/FaceBadge';

// ── LinkedSeedRow ───────────────────────────────────────────────

type LinkedSeedRowProps = {
  seedLink: SeedLink;
  incoming?: boolean;
};

const LinkedSeedRow = ({ seedLink, incoming = false }: LinkedSeedRowProps) => {
  const { seed, face } = seedLink;
  const formatRelative = useRelativeTime();
  const faceColor = getFaceColor(face.id);

  return (
    <Link
      href={`/seeds/${seed.id}`}
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px',
        background: 'var(--mf-surface)',
        borderRadius: 12,
        border: '0.5px solid var(--mf-line-soft)',
        borderLeft: `2.5px solid ${incoming ? 'var(--mf-accent)' : faceColor}`,
        marginBottom: 8,
        textDecoration: 'none',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <FaceBadge face={face} size={28} radius={7} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 5,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mf-brand)' }}>
            {getFaceTitle(face)}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--mf-text-muted)' }}>
            {formatRelative(seed.createdAt)}
          </span>
        </div>
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.6,
            color: 'var(--mf-ink)',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {seed.body}
        </div>
      </div>
    </Link>
  );
};

// ── SeedDetailPage ──────────────────────────────────────────────

type Props = {
  seed: Seed;
  face: Face;
  author: UserProfile | null;
  isOwner: boolean;
  outgoingLinks: SeedLink[];
  incomingLinks: SeedLink[];
  users: UserProfile[];
};

const SeedDetailPage = ({ seed, face, author, isOwner, outgoingLinks, incomingLinks }: Props) => {
  const t = useTranslations('seedDetail');
  const visibility = face.visibility === 'private' ? t('private') : t('public');

  return (
    <div style={{ padding: '14px 18px 80px' }}>
      {/* 著者行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
        <Link href={`/faces/${face.id}`} style={{ display: 'block', flexShrink: 0 }}>
          <FaceBadge face={face} size={40} radius={11} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <Link
              href={`/faces/${face.id}`}
              className="hover:underline"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--mf-brand)',
              }}
            >
              {getFaceTitle(face)}
            </Link>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--mf-text-sub)',
              marginTop: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {seed.createdAt.slice(0, 10).replace(/-/g, '.')} · {seed.createdAt.slice(11, 16)}
          </div>
        </div>
        {author && (
          <Link
            href={`/profile/${author.id}`}
            className="group"
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              minWidth: 0,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                overflow: 'hidden',
              }}
            >
              <Image
                src={getAvatarUrl(author)}
                alt={author.name}
                width={32}
                height={32}
                style={{ objectFit: 'cover', display: 'block', width: '100%', height: '100%' }}
              />
            </div>
            <span
              className="hidden md:inline group-hover:underline"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--mf-text-sub)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 100,
              }}
            >
              {author.name}
            </span>
          </Link>
        )}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 9px',
            background: 'var(--mf-surface-tint)',
            borderRadius: 999,
            fontSize: 11,
            color: 'var(--mf-text-sub)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          <svg
            width={11}
            height={11}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          >
            {face.visibility === 'private' ? (
              <>
                <rect x={4} y={7} width={8} height={7} rx={1.5} />
                <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
              </>
            ) : (
              <>
                <circle cx={8} cy={8} r={6} />
                <path d="M2.5 8c0-1 1-3 5.5-3s5.5 2 5.5 3-1 3-5.5 3S2.5 9 2.5 8z" />
                <circle cx={8} cy={8} r={2} fill="currentColor" />
              </>
            )}
          </svg>
          {visibility}
        </div>
      </div>

      {/* 本文 */}
      <div
        style={{
          fontFamily: 'var(--mf-font-sans)',
          fontSize: 16,
          lineHeight: 1.85,
          color: 'var(--mf-ink)',
          letterSpacing: 0.2,
          whiteSpace: 'pre-wrap',
          marginBottom: 16,
        }}
      >
        {seed.body}
      </div>

      {/* 画像グリッド */}
      {seed.images.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(seed.images.length, 2)}, 1fr)`,
            gap: 3,
            borderRadius: 14,
            overflow: 'hidden',
            border: '0.5px solid var(--mf-line-soft)',
            marginBottom: 14,
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
                sizes="300px"
              />
            </div>
          ))}
        </div>
      )}

      {/* アクション行 */}
      <div
        style={{
          padding: '12px 0',
          borderTop: '0.5px solid var(--mf-line)',
          borderBottom: '0.5px solid var(--mf-line)',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--mf-brand)',
            fontSize: 13,
            fontWeight: 600,
            padding: '4px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.5 9.5a3.54 3.54 0 005 0l2-2a3.54 3.54 0 00-5-5l-1 1" />
            <path d="M9.5 6.5a3.54 3.54 0 00-5 0l-2 2a3.54 3.54 0 005 5l1-1" />
          </svg>
          {t('linkToThisSeed')}
        </button>
        {isOwner && (
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--mf-text-sub)',
              fontSize: 13,
              fontWeight: 600,
              padding: '4px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 2a1.414 1.414 0 012 2L5 12l-3 1 1-3L11 2z" />
            </svg>
            {t('edit')}
          </button>
        )}
      </div>

      {/* 発信リンク */}
      {outgoingLinks.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg
              width={14}
              height={14}
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--mf-brand)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6.5 9.5a3.54 3.54 0 005 0l2-2a3.54 3.54 0 00-5-5l-1 1" />
              <path d="M9.5 6.5a3.54 3.54 0 00-5 0l-2 2a3.54 3.54 0 005 5l1-1" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mf-brand)' }}>
              {t('outgoingLinks')}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>
              {outgoingLinks.length} {t('linksUnit')}
            </span>
          </div>
          {outgoingLinks.map((link) => (
            <LinkedSeedRow key={link.seed.id} seedLink={link} />
          ))}
        </div>
      )}

      {/* 被リンク */}
      {incomingLinks.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg
              width={14}
              height={14}
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--mf-accent)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6.5 9.5a3.54 3.54 0 005 0l2-2a3.54 3.54 0 00-5-5l-1 1" />
              <path d="M9.5 6.5a3.54 3.54 0 00-5 0l-2 2a3.54 3.54 0 005 5l1-1" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mf-accent)' }}>
              {t('incomingLinks')}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>
              {incomingLinks.length} {t('linksUnit')}
            </span>
          </div>
          {incomingLinks.slice(0, 4).map((link) => (
            <LinkedSeedRow key={link.seed.id} seedLink={link} incoming />
          ))}
          {incomingLinks.length > 4 && (
            <div
              style={{
                textAlign: 'center',
                padding: '10px',
                fontSize: 12,
                color: 'var(--mf-text-sub)',
                fontWeight: 600,
              }}
            >
              {t('showMore', { count: incomingLinks.length - 4 })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeedDetailPage;
