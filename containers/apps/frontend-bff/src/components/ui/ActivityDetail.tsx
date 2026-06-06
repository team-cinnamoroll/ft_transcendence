'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getFaceTitle } from '@/lib/display';
import Avatar from './Avatar';
import Badge from './Badge';
import FaceChip from './FaceChip';
import { useRelativeTime } from '@/lib/use-relative-time';
import { useTranslations } from 'next-intl';

type ActivityDetailProps = {
  activityId: string;
  onClose: () => void;
};

type ActivityDetailApiResponse = {
  activity: Activity | null;
  user: UserProfile | null;
  face: Face | null;
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

const ActivityDetail = ({ activityId, onClose }: ActivityDetailProps) => {
  const t = useTranslations('activityDetail');
  const relativeTime = useRelativeTime();

  const [data, setData] = useState<ActivityDetailApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();
    setIsLoading(true);
    setData(null);

    void fetch(`/api/detail/activity/${encodeURIComponent(activityId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch activity detail: ${res.status}`);
        return (await res.json()) as ActivityDetailApiResponse;
      })
      .then((json) => { if (isCurrent) setData(json); })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setData(null);
      })
      .finally(() => { if (isCurrent) setIsLoading(false); });

    return () => { isCurrent = false; controller.abort(); };
  }, [activityId]);

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

  const activity = data?.activity ?? null;
  const face = data?.face ?? null;
  const user = data?.user ?? null;

  if (!activity || !user) {
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

  const resolvedFaceTitle = face ? getFaceTitle(face) : '';
  const faceTitle = resolvedFaceTitle || activity.faceId || t('unknownFace');
  const formattedTime = relativeTime(activity.createdAt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-text-muted)', margin: 0 }}>{t('title')}</h2>
        <CloseButton label={t('close')} onClick={onClose} />
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        {/* ユーザー・フェイス行 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Avatar src={user.avatarUrl} alt={user.name} size="md" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--mf-text)' }}>
              <span>{user.name}</span>
              {user.badge && <Badge emoji={user.badge} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaceChip title={faceTitle} faceId={activity.faceId} />
              <time dateTime={activity.createdAt} style={{ fontSize: 11, color: 'var(--mf-text-muted)' }}>
                {formattedTime}
              </time>
            </div>
          </div>
        </div>

        {/* 本文 */}
        <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--mf-ink)', whiteSpace: 'pre-wrap', margin: 0 }}>
          {activity.body}
        </p>

        {/* 画像グリッド */}
        {activity.imageUrls && activity.imageUrls.length > 0 && (
          <div
            style={{
              display: 'grid',
              gap: 6,
              overflow: 'hidden',
              borderRadius: 12,
              gridTemplateColumns: activity.imageUrls.length === 1 ? '1fr' : '1fr 1fr',
            }}
          >
            {activity.imageUrls.map((url, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 8 }}>
                <Image
                  src={url}
                  alt={t('imageAlt', { n: i + 1 })}
                  fill
                  className="object-cover"
                  sizes="(max-width: 384px) 100vw, 192px"
                />
              </div>
            ))}
          </div>
        )}

        {/* フェイスへのリンク */}
        <Link
          href={`/faces/${activity.faceId}`}
          style={{ fontSize: 12, color: 'var(--mf-accent)', textDecoration: 'none', alignSelf: 'flex-start', marginTop: 8 }}
        >
          {t('viewFace')}
        </Link>
      </div>
    </div>
  );
};

export default ActivityDetail;
