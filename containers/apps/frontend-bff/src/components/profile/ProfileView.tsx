'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ProfileWithRelationship } from '@/types/user-profile';
import type { FaceSummary } from '@/types/face';
import { getAvatarUrl, getFaceTitle, getFaceColor } from '@/lib/display';
import { loadMoreFacesAction } from '@/server/actions/faces';
import FriendActionButton from './FriendActionButton';

type Props = {
  profile: ProfileWithRelationship;
  initialFaceSummaries: FaceSummary[];
  facesNextCursor: string | null;
  isOwner: boolean;
};

const ProfileView = ({ profile, initialFaceSummaries, facesNextCursor, isOwner }: Props) => {
  const t = useTranslations('profilePage');
  const [faceSummaries, setFaceSummaries] = useState(initialFaceSummaries);
  const [facesCursor, setFacesCursor] = useState(facesNextCursor);
  const [isPending, startTransition] = useTransition();

  const handleLoadMoreFaces = () => {
    startTransition(async () => {
      const result = await loadMoreFacesAction(profile.id, facesCursor);
      if (!result.success) {
        return;
      }
      setFaceSummaries((prev) => [...prev, ...result.data.faceSummaries]);
      setFacesCursor(result.data.nextCursor);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 20px 24px',
          borderBottom: '0.5px solid var(--mf-line)',
        }}
      >
        <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden' }}>
          <Image
            src={getAvatarUrl(profile)}
            alt={profile.name}
            width={96}
            height={96}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </div>
        <div style={{ marginTop: 14, fontSize: 18, fontWeight: 700, color: 'var(--mf-brand)' }}>
          {profile.name}
        </div>
        {profile.badge && (
          <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--mf-text-sub)' }}>
            {profile.badge}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <FriendActionButton
            targetUserId={profile.id}
            targetUserName={profile.name}
            relationship={profile.relationship}
            isOwner={isOwner}
          />
        </div>
      </div>

      <div style={{ padding: '20px 20px 4px' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--mf-text-muted)',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {t('facesHeading', { count: faceSummaries.length })}
        </span>
      </div>

      {faceSummaries.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>{t('noFaces')}</p>
        </div>
      ) : (
        <div
          style={{
            padding: '12px 20px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {faceSummaries.map(({ face }) => {
            const color = getFaceColor(face.id);
            return (
              <Link key={face.id} href={`/faces/${face.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    height: 156,
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: 'var(--mf-surface)',
                    border: '0.5px solid var(--mf-line)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      height: 96,
                      flexShrink: 0,
                      background: face.image?.url ? undefined : color,
                      backgroundImage: face.image?.url ? `url(${face.image.url})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      padding: 8,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {face.visibility === 'private' && (
                      <div
                        style={{
                          padding: '3px 7px',
                          background: 'rgba(20,24,36,0.32)',
                          borderRadius: 999,
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                        }}
                      >
                        <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>
                          {t('private')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px', flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--mf-brand)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getFaceTitle(face)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {facesCursor && (
        <div style={{ textAlign: 'center', padding: '0 20px 32px' }}>
          <button
            type="button"
            onClick={handleLoadMoreFaces}
            disabled={isPending}
            style={{
              padding: '9px 20px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              border: '0.5px solid var(--mf-line)',
              background: 'var(--mf-surface)',
              color: 'var(--mf-text)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
