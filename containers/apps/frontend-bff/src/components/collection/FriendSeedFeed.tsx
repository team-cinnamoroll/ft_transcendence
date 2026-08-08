'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { useTranslations } from 'next-intl';
import SeedRow from '@/components/ui/SeedRow';
import Pagination from '@/components/ui/Pagination';
import SearchBar from '@/components/ui/SearchBar';
import FaceBadge from '@/components/ui/FaceBadge';
import { createLookupMap, getFaceTitle } from '@/lib/display';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { searchFacesAction } from '@/server/actions/faces';
import { searchSeedsAction } from '@/server/actions/seeds';
import { findUsersByIdsAction } from '@/server/actions/users';

type Props = {
  seeds: Seed[];
  faces: Face[];
  users: UserProfile[];
  currentUserId: string;
};

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const FriendSeedFeed = ({ seeds, faces, users, currentUserId }: Props) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const t = useTranslations('collection');

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const [searchedFaces, setSearchedFaces] = useState<Face[]>([]);
  const [searchedSeeds, setSearchedSeeds] = useState<Seed[]>([]);
  const [searchedAuthors, setSearchedAuthors] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSeedsPage, setSearchSeedsPage] = useState(1);

  useEffect(() => {
    const q = debouncedSearchQuery.trim();
    if (!q) {
      setSearchedFaces([]);
      setSearchedSeeds([]);
      setSearchedAuthors([]);
      setIsSearching(false);
      return;
    }

    let ignore = false;
    setIsSearching(true);
    Promise.all([searchFacesAction({ q }), searchSeedsAction({ q })]).then(
      async ([faceResults, seedResults]) => {
        if (ignore) return;
        const otherFaces = faceResults.filter((face) => face.userId !== currentUserId);
        const otherSeeds = seedResults.filter((seed) => seed.userId !== currentUserId);
        const authors = await findUsersByIdsAction(otherSeeds.map((seed) => seed.userId));
        if (ignore) return;
        setSearchedFaces(otherFaces);
        setSearchedSeeds(otherSeeds);
        setSearchedAuthors(authors);
        setIsSearching(false);
      }
    );

    return () => {
      ignore = true;
    };
  }, [debouncedSearchQuery, currentUserId]);

  const faceMap = useMemo(() => createLookupMap(faces, (face) => face.id), [faces]);
  const userMap = useMemo(() => createLookupMap(users, (user) => user.id), [users]);
  const searchedAuthorMap = useMemo(
    () => createLookupMap(searchedAuthors, (user) => user.id),
    [searchedAuthors]
  );

  const searchSeedsTotalPages = Math.ceil(searchedSeeds.length / PAGE_SIZE);
  const pagedSearchedSeeds = searchedSeeds.slice(
    (searchSeedsPage - 1) * PAGE_SIZE,
    searchSeedsPage * PAGE_SIZE
  );

  const totalPages = Math.ceil(seeds.length / PAGE_SIZE);
  const pagedSeeds = seeds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div>
      <div style={{ padding: '20px 18px 8px' }}>
        <SearchBar
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setSearchSeedsPage(1);
          }}
          placeholder={t('searchPlaceholder')}
        />
      </div>

      {isSearchActive ? (
        <div style={{ padding: '0 0 16px' }}>
          {isSearching && (
            <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', padding: '4px 20px' }}>
              {t('searching')}
            </p>
          )}

          {/* フェイス結果 */}
          <div style={{ padding: '12px 20px 6px' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--mf-text-muted)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {t('facesSection', { n: searchedFaces.length })}
            </span>
          </div>
          {searchedFaces.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', padding: '4px 20px' }}>
              {t('noMatch')}
            </p>
          ) : (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {searchedFaces.map((face) => (
                <Link
                  key={face.id}
                  href={`/faces/${face.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    textDecoration: 'none',
                  }}
                >
                  <FaceBadge face={face} size={36} radius={10} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--mf-brand)' }}>
                    {getFaceTitle(face)}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* シード結果 */}
          <div style={{ padding: '16px 20px 6px' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--mf-text-muted)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {t('seedsSection', { n: searchedSeeds.length })}
            </span>
          </div>
          {searchedSeeds.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', padding: '4px 20px' }}>
              {t('noMatch')}
            </p>
          ) : (
            <>
              <div style={{ padding: '0 20px' }}>
                {pagedSearchedSeeds.map((seed) => {
                  const face = faceMap.get(seed.faceId);
                  if (!face) return null;
                  return (
                    <SeedRow
                      key={seed.id}
                      seed={seed}
                      face={face}
                      author={searchedAuthorMap.get(seed.userId)}
                      onClick={() => router.push(`/seeds/${seed.id}`)}
                    />
                  );
                })}
              </div>
              <Pagination
                currentPage={searchSeedsPage}
                totalPages={searchSeedsTotalPages}
                onPageChange={setSearchSeedsPage}
              />
            </>
          )}
        </div>
      ) : seeds.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '80px 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>{t('empty')}</p>
        </div>
      ) : (
        <div>
          <div style={{ padding: '20px 18px 10px' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
              {t('title')}
            </p>
          </div>
          <div style={{ padding: '0 28px' }}>
            {pagedSeeds.map((seed) => {
              const face = faceMap.get(seed.faceId);
              if (!face) return null;
              return (
                <SeedRow
                  key={seed.id}
                  seed={seed}
                  face={face}
                  author={userMap.get(seed.userId)}
                  onClick={() => router.push(`/seeds/${seed.id}`)}
                />
              );
            })}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default FriendSeedFeed;
