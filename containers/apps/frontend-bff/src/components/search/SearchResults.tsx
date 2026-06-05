'use client';

import { type Activity } from '@/types/activity';
import { type UserProfile } from '@/types/user-profile';
import { type Face } from '@/types/face';
import SeedRow from '@/components/ui/SeedRow';
import { useTranslations } from 'next-intl';

export type SearchActivityResultItem = {
  activity: Activity;
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
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-3xl">🔍</p>
        <p className="text-sm text-zinc-400">{t('emptyTitle')}</p>
        <p className="text-xs text-zinc-600">{t('emptyHint')}</p>
      </div>
    );
  }

  const totalCount = faceResults.length + activityResults.length;

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-3xl">😶</p>
        <p className="text-sm text-zinc-400">{t('noResultsTitle', { query })}</p>
        <p className="text-xs text-zinc-600">{t('noResultsHint')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* フェイス検索結果セクション */}
      {faceResults.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t('facesSection')}
            <span className="ml-2 text-violet-400">{faceResults.length}</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {faceResults.map((face) => {
              const isSubscribed = subscribedFaceIds.includes(face.id);
              return (
                <li
                  key={face.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-800/60 px-4 py-3 transition hover:bg-zinc-800"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {face.emoji && <span className="text-2xl">{face.emoji}</span>}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-100">{face.name}</p>
                      {face.description && (
                        <p className="truncate text-xs text-zinc-400">{face.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    className={
                      isSubscribed
                        ? 'shrink-0 rounded-full border border-violet-500 px-3 py-1 text-xs font-medium text-violet-400'
                        : 'shrink-0 rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500'
                    }
                    disabled
                    aria-label={
                      isSubscribed
                        ? t('unsubscribeAriaLabel', { name: face.name })
                        : t('subscribeAriaLabel', { name: face.name })
                    }
                  >
                    {isSubscribed ? t('subscribed') : t('subscribe')}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* アクティビティ検索結果セクション */}
      {activityResults.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t('activitiesSection')}
            <span className="ml-2 text-violet-400">{activityResults.length}</span>
          </h2>
          <div style={{ padding: '0 4px' }}>
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
