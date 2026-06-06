'use client';

import { useEffect, useState } from 'react';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { createLookupMap } from '@/lib/display';
import FaceHeader from '@/components/face/FaceHeader';
import SeedRow from './SeedRow';
import { useTranslations } from 'next-intl';

type FaceDetailProps = {
  faceId: string;
  onClose: () => void;
};

type FaceDetailApiResponse = {
  currentUser: UserProfile;
  face: Face | null;
  activities: Activity[];
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

  const [data, setData] = useState<FaceDetailApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  const activities = data?.activities ?? [];
  const users = data?.users ?? [];
  const userMap = createLookupMap(users, (user) => user.id);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-text-muted)', margin: 0 }}>{t('title')}</h2>
        <CloseButton label={t('close')} onClick={onClose} />
      </div>

      <FaceHeader face={face} isOwner={isOwner} />

      <div style={{ borderBottom: '0.5px solid var(--mf-line)' }} />

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--mf-text-muted)' }}>
          {t('activitiesHeading')}
        </p>
        {activities.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--mf-text-faint)' }}>{t('noActivities')}</p>
        ) : (
          activities.map((activity, i) => {
            const activityUser = userMap.get(activity.userId);
            if (!activityUser) return null;
            return (
              <SeedRow
                key={activity.id}
                activity={activity}
                face={face}
                noBorder={i === activities.length - 1}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default FaceDetail;
