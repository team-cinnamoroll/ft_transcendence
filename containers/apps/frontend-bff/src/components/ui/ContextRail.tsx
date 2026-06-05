'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getFaceTitle, getFaceColor } from '@/lib/display';
import { useRelativeTime } from '@/lib/use-relative-time';
import FaceBadge from '@/components/ui/FaceBadge';
import FaceChip from '@/components/ui/FaceChip';
import RailCard from '@/components/ui/RailCard';

// ── WritingRail ────────────────────────────────────────────────

type WritingRailProps = {
  activities: Activity[];
  faces: Face[];
};

const WritingRail = ({ activities, faces }: WritingRailProps) => {
  const t = useTranslations('contextRail');
  const today = new Date();
  const mmdd = today.toISOString().slice(5, 10);

  const faceById = new Map(faces.map((f) => [f.id, f]));

  const onThisDay = activities.find((a) => {
    const d = a.createdAt.slice(0, 10);
    return d.slice(5) === mmdd && d.slice(0, 4) !== String(today.getFullYear());
  });
  const onThisDayFace = onThisDay ? faceById.get(onThisDay.faceId) : undefined;
  const yearsAgo = onThisDay
    ? today.getFullYear() - parseInt(onThisDay.createdAt.slice(0, 4), 10)
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
  activities: Activity[];
};

const ReflectionRail = ({ faces, activities }: ReflectionRailProps) => {
  const t = useTranslations('contextRail');
  const thisMonth = new Date().toISOString().slice(0, 7);

  const monthlyCountMap = new Map<string, number>();
  for (const act of activities) {
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

      <RailCard title={t('activitiesThisMonth')} action={t('thisMonth')}>
        {facesWithCount.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--mf-text-muted)', margin: 0 }}>
            {t('noActivitiesThisMonth')}
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
                      <span
                        style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-text)' }}
                      >
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
  subscribedFaces: Face[];
  latestActivityByFaceId: Record<string, Activity>;
  users: UserProfile[];
};

const CollectionRail = ({
  subscribedFaces,
  latestActivityByFaceId,
  users,
}: CollectionRailProps) => {
  const t = useTranslations('contextRail');
  const formatRelative = useRelativeTime();
  const userMap = new Map(users.map((u) => [u.id, u]));

  const UNREAD_CUTOFF = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {subscribedFaces.length > 0 ? (
        <RailCard title={t('subscribedFaces')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subscribedFaces.map((face) => {
              const lastAct = latestActivityByFaceId[face.id];
              const owner = userMap.get(face.userId);
              const hasUnread = lastAct && lastAct.createdAt >= UNREAD_CUTOFF;
              return (
                <Link
                  key={face.id}
                  href={`/faces/${face.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <FaceBadge face={face} size={32} radius={9} />
                    {hasUnread && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--mf-accent)',
                          border: '1.5px solid var(--mf-surface)',
                        }}
                      />
                    )}
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
                      {getFaceTitle(face)}
                    </div>
                    {owner && (
                      <div style={{ fontSize: 11, color: 'var(--mf-text-muted)', marginTop: 1 }}>
                        {owner.name}
                      </div>
                    )}
                  </div>
                  {lastAct && (
                    <span style={{ fontSize: 10.5, color: 'var(--mf-text-faint)', flexShrink: 0 }}>
                      {formatRelative(lastAct.createdAt)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </RailCard>
      ) : (
        <RailCard title={t('subscribedFaces')}>
          <p
            style={{
              fontSize: 12.5,
              color: 'var(--mf-text-muted)',
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            {t('noSubscriptions')}
            <br />
            <Link
              href="/search"
              style={{
                color: 'var(--mf-accent)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {t('findFaces')}
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
  activities: Activity[];
  subscribedFaces: Face[];
  latestActivityByFaceId: Record<string, Activity>;
  users: UserProfile[];
};

const ContextRail = ({
  faces,
  activities,
  subscribedFaces,
  latestActivityByFaceId,
  users,
}: ContextRailProps) => {
  const pathname = usePathname();

  const renderContent = () => {
    if (pathname === '/faces' || pathname.startsWith('/faces/')) {
      return <ReflectionRail faces={faces} activities={activities} />;
    }
    if (pathname === '/subscriptions') {
      return (
        <CollectionRail
          subscribedFaces={subscribedFaces}
          latestActivityByFaceId={latestActivityByFaceId}
          users={users}
        />
      );
    }
    return <WritingRail activities={activities} faces={faces} />;
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
