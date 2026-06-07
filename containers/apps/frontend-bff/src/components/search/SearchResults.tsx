'use client';

import { type Seed } from '@/types/seed';
import { type UserProfile } from '@/types/user-profile';
import { type Face } from '@/types/face';
import SeedRow from '@/components/ui/SeedRow';
import FaceBadge from '@/components/ui/FaceBadge';
import { getFaceTitle } from '@/lib/display';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export type SearchActivityResultItem = {
  activity: Seed;
  user: UserProfile;
  face: Face;
};

type SearchResultsProps = {
  query: string;
  activityResults: SearchActivityResultItem[];
  faceResults: Face[];
  subscribedFaceIds: string[];
};

const SearchResults = ({
  query,
  activityResults,
  faceResults,
  subscribedFaceIds,
}: SearchResultsProps) => {
  const t = useTranslations('searchResults');

  if (!query) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '80px 0',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 32 }}>🔍</p>
        <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>{t('emptyTitle')}</p>
        <p style={{ fontSize: 11.5, color: 'var(--mf-text-faint)' }}>{t('emptyHint')}</p>
      </div>
    );
  }

  const totalCount = faceResults.length + activityResults.length;

  if (totalCount === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '80px 0',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 32 }}>😶</p>
        <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>
          {t('noResultsTitle', { query })}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* フェイス検索結果 */}
      {faceResults.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--mf-text-muted)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            {t('facesSection')}
            <span style={{ marginLeft: 6, color: 'var(--mf-accent)' }}>{faceResults.length}</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faceResults.map((face) => {
              const isSubscribed = subscribedFaceIds.includes(face.id);
              return (
                <Link key={face.id} href={`/faces/${face.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: 'var(--mf-surface)',
                      border: '0.5px solid var(--mf-line)',
                    }}
                  >
                    <FaceBadge face={face} size={44} radius={12} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--mf-brand)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          margin: 0,
                        }}
                      >
                        {getFaceTitle(face)}
                      </p>
                      {face.description && (
                        <p
                          style={{
                            fontSize: 12,
                            color: 'var(--mf-text-sub)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            margin: 0,
                            marginTop: 2,
                          }}
                        >
                          {face.description}
                        </p>
                      )}
                    </div>
                    <button
                      style={{
                        flexShrink: 0,
                        padding: '5px 12px',
                        borderRadius: 999,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: isSubscribed ? 'transparent' : 'var(--mf-accent)',
                        color: isSubscribed ? 'var(--mf-text-sub)' : '#fff',
                        border: isSubscribed ? '1px solid var(--mf-line)' : 'none',
                        cursor: 'default',
                      }}
                      disabled
                      aria-label={isSubscribed ? t('unsubscribeAriaLabel', { name: face.name }) : t('subscribeAriaLabel', { name: face.name })}
                    >
                      {isSubscribed ? t('subscribed') : t('subscribe')}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* アクティビティ検索結果 */}
      {activityResults.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--mf-text-muted)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            {t('activitiesSection')}
            <span style={{ marginLeft: 6, color: 'var(--mf-accent)' }}>{activityResults.length}</span>
          </h2>
          <div>
            {activityResults.map(({ activity, face }, index) => (
              <SeedRow
                key={activity.id}
                activity={activity}
                face={face}
                noBorder={index === activityResults.length - 1}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchResults;
