'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { createLookupMap } from '@/lib/display';
import SearchBar from '@/components/search/SearchBar';
import SearchScopeSelector, { type SearchScope } from '@/components/search/SearchScopeSelector';
import SearchResults, { type SearchActivityResultItem } from '@/components/search/SearchResults';

type SearchClientProps = {
  allActivities: Activity[];
  allFaces: Face[];
  allUsers: UserProfile[];
  currentUserId: string;
  subscribedFaceIds: string[];
};

const SearchClient = ({
  allActivities,
  allFaces,
  allUsers,
  currentUserId,
  subscribedFaceIds,
}: SearchClientProps) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const t = useTranslations('searchClient');

  const faceMap = useMemo(() => createLookupMap(allFaces, (face) => face.id), [allFaces]);
  const userMap = useMemo(() => createLookupMap(allUsers, (user) => user.id), [allUsers]);

  const activityResults = useMemo<SearchActivityResultItem[]>(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    const lowerQuery = trimmedQuery.toLowerCase();
    const scopedActivities = allActivities.filter((activity) => {
      if (scope === 'mine') return activity.userId === currentUserId;
      if (scope === 'subscribed') return subscribedFaceIds.includes(activity.faceId);
      return true;
    });

    return scopedActivities.flatMap((activity) => {
      if (!activity.body.toLowerCase().includes(lowerQuery)) return [];
      const user = userMap.get(activity.userId);
      const face = faceMap.get(activity.faceId);
      if (!user || !face) return [];
      return [{ activity, user, face }];
    });
  }, [allActivities, currentUserId, faceMap, query, scope, subscribedFaceIds, userMap]);

  const faceResults = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];
    const lowerQuery = trimmedQuery.toLowerCase();
    return allFaces.filter(
      (face) =>
        face.name.toLowerCase().includes(lowerQuery) ||
        (face.description ?? '').toLowerCase().includes(lowerQuery)
    );
  }, [allFaces, query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--mf-bg-light)',
          borderBottom: '0.5px solid var(--mf-line)',
          padding: '14px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
          {t('title')}
        </h1>
        <SearchBar value={query} onChange={setQuery} />
        <SearchScopeSelector scope={scope} onScopeChange={setScope} />
      </header>

      <main style={{ padding: '16px 20px' }}>
        <SearchResults
          query={query.trim()}
          activityResults={activityResults}
          faceResults={faceResults}
          subscribedFaceIds={subscribedFaceIds}
        />
      </main>
    </div>
  );
};

export default SearchClient;
