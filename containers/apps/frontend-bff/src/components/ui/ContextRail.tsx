'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import type { FriendProfileWithOnlineStatus } from '@/types/friendship';
import { getFaceTitle, getFaceColor, getAvatarUrl } from '@/lib/display';
import FaceBadge from '@/components/ui/FaceBadge';
import FaceChip from '@/components/ui/FaceChip';
import RailCard from '@/components/ui/RailCard';
import { getCurrentMmDdInJST, getCurrentYearInJST, getCurrentMonthInJST } from '@/lib/date-utils';

// ── WritingRail ────────────────────────────────────────────────

type WritingRailProps = {
  seeds: Seed[];
  faces: Face[];
};

const WritingRail = ({ seeds, faces }: WritingRailProps) => {
  const t = useTranslations('contextRail');
  const mmdd = getCurrentMmDdInJST();
  const currentYear = getCurrentYearInJST();

  const faceById = new Map(faces.map((f) => [f.id, f]));

  const onThisDay = seeds.find((a) => {
    const d = a.createdAt.slice(0, 10);
    return d.slice(5) === mmdd && d.slice(0, 4) !== currentYear;
  });
  const onThisDayFace = onThisDay ? faceById.get(onThisDay.faceId) : undefined;
  const yearsAgo = onThisDay
    ? parseInt(currentYear, 10) - parseInt(onThisDay.createdAt.slice(0, 4), 10)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {onThisDay && onThisDayFace && (
        <RailCard title={t('onThisDay')} action={t('yearsAgo', { n: yearsAgo })}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FaceChip faceId={onThisDayFace.id} title={getFaceTitle(onThisDayFace)} />
            <span style={{ fontSize: 10.5, color: 'var(--mf-text-muted)' }}>
              {onThisDay.createdAt.slice(0, 10).replace(/-/g, '.')}
            </span>
          </div>
          <p
            style={{
              fontSize: 12.5,
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
              fontSize: 11,
              color: 'var(--mf-text-muted)',
              fontStyle: 'italic',
              margin: '6px 0 0',
            }}
          >
            {t('onThisDayPrompt')}
          </p>
        </RailCard>
      )}
    </div>
  );
};

// ── ReflectionRail ─────────────────────────────────────────────

type ReflectionRailProps = {
  faces: Face[];
  seeds: Seed[];
};

const ReflectionRail = ({ faces, seeds }: ReflectionRailProps) => {
  const t = useTranslations('contextRail');
  const thisMonth = getCurrentMonthInJST();

  const monthlyCountMap = new Map<string, number>();
  for (const act of seeds) {
    if (act.createdAt.startsWith(thisMonth)) {
      monthlyCountMap.set(act.faceId, (monthlyCountMap.get(act.faceId) ?? 0) + 1);
    }
  }

  const facesWithCount = faces
    .map((f) => ({ face: f, count: monthlyCountMap.get(f.id) ?? 0 }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxCount = Math.max(...facesWithCount.map(({ count }) => count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <RailCard title={t('aboutFaces')}>
        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.75,
            color: 'var(--mf-text-sub)',
            margin: 0,
          }}
        >
          {t('aboutFacesDesc')}
        </p>
      </RailCard>

      <RailCard title={t('seedsThisMonth')} action={t('thisMonth')}>
        {facesWithCount.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--mf-text-muted)', margin: 0 }}>
            {t('noSeedsThisMonth')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {facesWithCount.map(({ face, count }) => {
              const color = getFaceColor(face.id);
              const pct = (count / maxCount) * 100;
              return (
                <div key={face.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FaceBadge face={face} size={24} radius={6} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text)' }}>
                        {getFaceTitle(face)}
                      </span>
                      <span
                        style={{ fontSize: 11, color: 'var(--mf-text-muted)', fontWeight: 600 }}
                      >
                        {count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: 'var(--mf-surface-tint)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </RailCard>
    </div>
  );
};

// ── CollectionRail ─────────────────────────────────────────────

type CollectionRailProps = {
  friends: FriendProfileWithOnlineStatus[];
};

const CollectionRail = ({ friends }: CollectionRailProps) => {
  const t = useTranslations('contextRail');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {friends.length > 0 ? (
        <RailCard title={t('friends')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {friends.map(({ friendshipId, friendProfile, isOnline }) => (
              <Link
                key={friendshipId}
                href={`/profile/${friendProfile.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden' }}>
                    <Image
                      src={getAvatarUrl(friendProfile)}
                      alt={friendProfile.name}
                      width={32}
                      height={32}
                      style={{
                        objectFit: 'cover',
                        display: 'block',
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </div>
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isOnline ? '#4caf50' : '#9aa0a6',
                      border: '1.5px solid var(--mf-surface)',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: 'var(--mf-brand)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {friendProfile.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </RailCard>
      ) : (
        <RailCard title={t('friends')}>
          <p
            style={{
              fontSize: 12.5,
              color: 'var(--mf-text-muted)',
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            {t('noFriends')}
            <br />
            <Link
              href="/friends"
              style={{
                color: 'var(--mf-accent)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {t('findFriends')}
            </Link>
          </p>
        </RailCard>
      )}
    </div>
  );
};

// ── ContextRail（メイン） ───────────────────────────────────────

export type ContextRailProps = {
  user: UserProfile;
  faces: Face[];
  seeds: Seed[];
  friends: FriendProfileWithOnlineStatus[];
};

const ContextRail = ({ faces, seeds, friends }: ContextRailProps) => {
  const pathname = usePathname();

  const renderContent = () => {
    if (pathname === '/faces' || pathname.startsWith('/faces/')) {
      return <ReflectionRail faces={faces} seeds={seeds} />;
    }
    if (pathname === '/collection') {
      return <CollectionRail friends={friends} />;
    }
    return <WritingRail seeds={seeds} faces={faces} />;
  };

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 overflow-y-auto mf-scroll"
      style={{
        width: 340,
        padding: '24px 20px 24px 0',
      }}
    >
      <div key={`page-${pathname}`} style={{ flex: 1 }}>
        {renderContent()}
      </div>
    </aside>
  );
};

export default ContextRail;
