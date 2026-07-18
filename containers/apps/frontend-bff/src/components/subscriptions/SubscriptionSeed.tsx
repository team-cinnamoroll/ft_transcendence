'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { useTranslations } from 'next-intl';
import SeedRow from '@/components/ui/SeedRow';
import Pagination from '@/components/ui/Pagination';
import FaceBadge from '@/components/ui/FaceBadge';
import EditSeedModal from '@/components/seed/EditSeedModal';
import { deleteSeedAction } from '@/server/actions/seeds';
import { subscribeAction, unsubscribeAction } from '@/server/actions/subscriptions';
import { createLookupMap, getFaceTitle } from '@/lib/display';

type SeedActionMenu = { seed: Seed; top: number; right: number };

type SearchFaceRowProps = {
  face: Face;
  isSubscribed: boolean;
  onToggle: () => void;
};

const SearchFaceRow = ({ face, isSubscribed, onToggle }: SearchFaceRowProps) => {
  const t = useTranslations('subscriptionSeed');
  return (
    <Link href={`/faces/${face.id}`} style={{ textDecoration: 'none' }}>
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
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
          style={{
            flexShrink: 0,
            padding: '5px 12px',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            background: isSubscribed ? 'transparent' : 'var(--mf-accent)',
            color: isSubscribed ? 'var(--mf-text-sub)' : '#fff',
            border: isSubscribed ? '1px solid var(--mf-line)' : 'none',
            cursor: 'pointer',
          }}
          aria-label={
            isSubscribed
              ? t('unsubscribeAriaLabel', { name: getFaceTitle(face) })
              : t('subscribeAriaLabel', { name: getFaceTitle(face) })
          }
        >
          {isSubscribed ? t('subscribed') : t('subscribe')}
        </button>
      </div>
    </Link>
  );
};

const RECOMMENDED_FACES = [
  {
    color: '#5B8DB8',
    kanji: '読',
    name: '読書',
    handle: 'h_maru',
    subs: 412,
    desc: '読みながら考えたこと',
  },
  {
    color: '#7B6B9E',
    kanji: '映',
    name: '映画断片',
    handle: 'sayaka_t',
    subs: 287,
    desc: '観終わってからしばらく',
  },
  {
    color: '#A89050',
    kanji: '珈',
    name: '朝の珈琲',
    handle: 'kettle_co',
    subs: 198,
    desc: '一杯目のメモ',
  },
  {
    color: '#B06B7A',
    kanji: '夜',
    name: '夜更けに',
    handle: 'yorunoyoru',
    subs: 156,
    desc: '23時以降のひとりごと',
  },
];

const EmptyState = () => {
  const t = useTranslations('subscriptionSeed');
  return (
    <div>
      {/* Quiet Feed バナー */}
      <div
        style={{
          margin: '20px 18px 0',
          padding: '24px 22px',
          borderRadius: 16,
          background: 'var(--mf-brand)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 35%, rgba(248,246,241,0.18) 0%, rgba(248,246,241,0.04) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div
            style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--mf-accent)' }}
          />
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--mf-accent)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Quiet Feed
          </div>
        </div>
        <div
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            fontWeight: 700,
            color: '#F8F6F1',
            letterSpacing: 0.2,
            position: 'relative',
          }}
        >
          {t.rich('emptyHeadline', { br: () => <br /> })}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            lineHeight: 1.7,
            color: 'rgba(248,246,241,0.7)',
            position: 'relative',
          }}
        >
          {t.rich('emptyBody', { br: () => <br /> })}
        </div>
      </div>

      {/* おすすめのフェイス */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            padding: '0 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--mf-brand)', letterSpacing: 0.2 }}
          >
            {t('recommendedTitle')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--mf-text-muted)' }}>
            {t('recommendedSubtitle')}
          </div>
        </div>
        {RECOMMENDED_FACES.map((r, i) => (
          <div
            key={r.handle}
            style={{
              padding: '12px 18px',
              borderBottom:
                i < RECOMMENDED_FACES.length - 1 ? '0.5px solid var(--mf-line-soft)' : 'none',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: r.color,
                color: '#fff',
                fontFamily: 'var(--mf-font-serif)',
                fontSize: 20,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {r.kanji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mf-brand)' }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>@{r.handle}</div>
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11.5,
                  color: 'var(--mf-text-sub)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.desc} · {t('subscriberCount', { n: r.subs })}
              </div>
            </div>
            <button
              type="button"
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                background: i === 0 ? 'var(--mf-brand)' : 'transparent',
                border: i === 0 ? 'none' : '1px solid var(--mf-brand)',
                color: i === 0 ? '#F8F6F1' : 'var(--mf-brand)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {t('subscribeAction')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

type Props = {
  subscribedFaceIds: string[];
  subscribedSeeds: Seed[];
  allSeeds: Seed[];
  faces: Face[];
  users: UserProfile[];
  currentUserId?: string;
};

const SubscriptionSeed = ({
  subscribedFaceIds: initialSubscribedFaceIds,
  subscribedSeeds,
  allSeeds,
  faces,
  currentUserId,
}: Props) => {
  const router = useRouter();
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [showFaceFilter, setShowFaceFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchTab, setSearchTab] = useState<'subscribed' | 'other'>('subscribed');
  const [seedPage, setSeedPage] = useState(1);
  const [searchSeedsPage, setSearchSeedsPage] = useState(1);
  const [seeds, setSeeds] = useState<Seed[]>(subscribedSeeds);
  const [localSubscribedFaceIds, setLocalSubscribedFaceIds] =
    useState<string[]>(initialSubscribedFaceIds);
  const [seedActionMenu, setSeedActionMenu] = useState<SeedActionMenu | null>(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [deletingSeed, setDeletingSeed] = useState<Seed | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [, startSubscribeTransition] = useTransition();
  const t = useTranslations('subscriptionSeed');
  const tSeed = useTranslations('seedActions');

  const openSeedActionMenu = (e: React.MouseEvent<HTMLButtonElement>, seed: Seed) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight + 4 ? rect.bottom + 4 : rect.top - menuHeight - 4;
    setSeedActionMenu({ seed, top, right: window.innerWidth - rect.right });
  };

  const handleSeedUpdate = (updatedSeed: Seed) => {
    setSeeds((prev) => prev.map((s) => (s.id === updatedSeed.id ? updatedSeed : s)));
  };

  const handleConfirmSeedDelete = () => {
    if (!deletingSeed || isDeleting) return;
    const seedId = deletingSeed.id;
    startDeleteTransition(async () => {
      await deleteSeedAction(seedId);
      setSeeds((prev) => prev.filter((s) => s.id !== seedId));
      setDeletingSeed(null);
    });
  };

  const subscribedFaces = useMemo(
    () => faces.filter((f) => localSubscribedFaceIds.includes(f.id)),
    [faces, localSubscribedFaceIds]
  );

  const faceMap = useMemo(
    () => createLookupMap(subscribedFaces, (face) => face.id),
    [subscribedFaces]
  );
  const allFaceMap = useMemo(() => createLookupMap(faces, (face) => face.id), [faces]);

  const handleSubscribeToggle = (face: Face) => {
    const isSubscribed = localSubscribedFaceIds.includes(face.id);
    setLocalSubscribedFaceIds((prev) =>
      isSubscribed ? prev.filter((id) => id !== face.id) : [...prev, face.id]
    );
    startSubscribeTransition(async () => {
      if (isSubscribed) {
        await unsubscribeAction(face.id);
      } else {
        await subscribeAction(face.id);
      }
    });
  };

  const filteredSeeds = useMemo(() => {
    let result = selectedFaceId ? seeds.filter((a) => a.faceId === selectedFaceId) : seeds;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => {
        const face = faceMap.get(a.faceId);
        return (
          a.body.toLowerCase().includes(q) || (face && getFaceTitle(face).toLowerCase().includes(q))
        );
      });
    }
    return result;
  }, [seeds, selectedFaceId, searchQuery, faceMap]);

  const subscribedIdSet = useMemo(() => new Set(localSubscribedFaceIds), [localSubscribedFaceIds]);

  const subscribedMatchingFaces = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return subscribedFaces.filter(
      (f) => getFaceTitle(f).toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)
    );
  }, [searchQuery, subscribedFaces]);

  const otherMatchingFaces = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return faces.filter(
      (f) =>
        !subscribedIdSet.has(f.id) &&
        (getFaceTitle(f).toLowerCase().includes(q) || f.description?.toLowerCase().includes(q))
    );
  }, [searchQuery, faces, subscribedIdSet]);

  const subscribedMatchingSeeds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allSeeds.filter(
      (s) => subscribedIdSet.has(s.faceId) && s.body.toLowerCase().includes(q)
    );
  }, [searchQuery, allSeeds, subscribedIdSet]);

  const otherMatchingSeeds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allSeeds.filter(
      (s) => !subscribedIdSet.has(s.faceId) && s.body.toLowerCase().includes(q)
    );
  }, [searchQuery, allSeeds, subscribedIdSet]);

  const PAGE_SIZE = 10;

  const seedTotalPages = Math.ceil(filteredSeeds.length / PAGE_SIZE);
  const pagedFilteredSeeds = filteredSeeds.slice((seedPage - 1) * PAGE_SIZE, seedPage * PAGE_SIZE);

  const subscribedSeedsTotalPages = Math.ceil(subscribedMatchingSeeds.length / PAGE_SIZE);
  const pagedSubscribedSeeds = subscribedMatchingSeeds.slice(
    (searchSeedsPage - 1) * PAGE_SIZE,
    searchSeedsPage * PAGE_SIZE
  );

  const otherSeedsTotalPages = Math.ceil(otherMatchingSeeds.length / PAGE_SIZE);
  const pagedOtherSeeds = otherMatchingSeeds.slice(
    (searchSeedsPage - 1) * PAGE_SIZE,
    searchSeedsPage * PAGE_SIZE
  );

  return (
    <div onClick={() => setShowFaceFilter(false)}>
      {/* 検索バー */}
      <div style={{ padding: '20px 18px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--mf-surface)',
            borderRadius: 12,
            border: isSearchFocused ? '1px solid var(--mf-accent)' : '0.5px solid var(--mf-line)',
            transition: 'border-color 0.15s',
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 18 18"
            fill="none"
            stroke={isSearchFocused ? 'var(--mf-accent)' : 'var(--mf-text-muted)'}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx={8} cy={8} r={5.5} />
            <path d="M12.2 12.2L16 16" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchSeedsPage(1);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={t('filterPlaceholder')}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              color: 'var(--mf-text)',
              outline: 'none',
              fontFamily: 'var(--mf-font-sans)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--mf-text-muted)',
                padding: 0,
              }}
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
              >
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 探索モードバッジ */}
        {(isSearchFocused || !!searchQuery.trim()) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 2px 14px' }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--mf-accent)',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11.5, color: 'var(--mf-accent)', fontWeight: 600 }}>
              {t('exploringAll')}
            </span>
          </div>
        )}
        {!isSearchFocused && !searchQuery.trim() && <div style={{ height: 14 }} />}
      </div>

      {/* 探索プロンプト：フォーカスありクエリなし */}
      {isSearchFocused && !searchQuery.trim() && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <svg
            width={36}
            height={36}
            viewBox="0 0 18 18"
            fill="none"
            stroke="var(--mf-accent)"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.6 }}
          >
            <circle cx={8} cy={8} r={5.5} />
            <path d="M12.2 12.2L16 16" />
          </svg>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
            {t('explorePromptTitle')}
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', margin: 0, lineHeight: 1.7 }}>
            {t('explorePromptHint')}
          </p>
        </div>
      )}

      {/* 検索結果 */}
      {searchQuery.trim() ? (
        <div style={{ paddingBottom: 16 }}>
          {/* タブバー */}
          <div
            style={{
              display: 'flex',
              borderBottom: '0.5px solid var(--mf-line)',
              padding: '4px 20px 0',
              gap: 4,
            }}
          >
            {(['subscribed', 'other'] as const).map((tab) => {
              const count =
                tab === 'subscribed'
                  ? subscribedMatchingFaces.length + subscribedMatchingSeeds.length
                  : otherMatchingFaces.length + otherMatchingSeeds.length;
              const isActive = searchTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setSearchTab(tab);
                    setSearchSeedsPage(1);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 10px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: isActive ? 'var(--mf-accent)' : 'var(--mf-text-muted)',
                    background: 'none',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--mf-accent)' : '2px solid transparent',
                    cursor: 'pointer',
                    marginBottom: -1,
                    transition: 'color 0.15s',
                  }}
                >
                  {tab === 'subscribed' ? t('searchTabSubscribed') : t('searchTabOther')}
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 500,
                      color: isActive ? 'var(--mf-accent)' : 'var(--mf-text-muted)',
                      opacity: 0.75,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* サブスク中タブ */}
          {searchTab === 'subscribed' && (
            <>
              {subscribedMatchingFaces.length > 0 && (
                <>
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
                      {t('searchSubscribedFacesSection', { n: subscribedMatchingFaces.length })}
                    </span>
                  </div>
                  <div
                    style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    {subscribedMatchingFaces.map((face) => (
                      <SearchFaceRow
                        key={face.id}
                        face={face}
                        isSubscribed={true}
                        onToggle={() => handleSubscribeToggle(face)}
                      />
                    ))}
                  </div>
                </>
              )}

              {subscribedMatchingSeeds.length > 0 && (
                <>
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
                      {t('searchSubscribedSeedsSection', { n: subscribedMatchingSeeds.length })}
                    </span>
                  </div>
                  <div style={{ padding: '0 20px' }}>
                    {pagedSubscribedSeeds.map((seed) => {
                      const face = allFaceMap.get(seed.faceId);
                      if (!face) return null;
                      return (
                        <SeedRow
                          key={seed.id}
                          seed={seed}
                          face={face}
                          currentUserId={currentUserId}
                          onMoreOptions={openSeedActionMenu}
                          onClick={() => router.push(`/seeds/${seed.id}`)}
                        />
                      );
                    })}
                  </div>
                  <Pagination
                    currentPage={searchSeedsPage}
                    totalPages={subscribedSeedsTotalPages}
                    onPageChange={setSearchSeedsPage}
                  />
                </>
              )}

              {subscribedMatchingFaces.length === 0 && subscribedMatchingSeeds.length === 0 && (
                <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', padding: '20px 20px' }}>
                  {t('noMatch')}
                </p>
              )}
            </>
          )}

          {/* その他タブ */}
          {searchTab === 'other' && (
            <>
              {otherMatchingFaces.length > 0 && (
                <>
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
                      {t('searchOtherFacesSection', { n: otherMatchingFaces.length })}
                    </span>
                  </div>
                  <div
                    style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    {otherMatchingFaces.map((face) => (
                      <SearchFaceRow
                        key={face.id}
                        face={face}
                        isSubscribed={false}
                        onToggle={() => handleSubscribeToggle(face)}
                      />
                    ))}
                  </div>
                </>
              )}

              {otherMatchingSeeds.length > 0 && (
                <>
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
                      {t('searchOtherSeedsSection', { n: otherMatchingSeeds.length })}
                    </span>
                  </div>
                  <div style={{ padding: '0 20px' }}>
                    {pagedOtherSeeds.map((seed) => {
                      const face = allFaceMap.get(seed.faceId);
                      if (!face) return null;
                      return (
                        <SeedRow
                          key={seed.id}
                          seed={seed}
                          face={face}
                          onClick={() => router.push(`/seeds/${seed.id}`)}
                        />
                      );
                    })}
                  </div>
                  <Pagination
                    currentPage={searchSeedsPage}
                    totalPages={otherSeedsTotalPages}
                    onPageChange={setSearchSeedsPage}
                  />
                </>
              )}

              {otherMatchingFaces.length === 0 && otherMatchingSeeds.length === 0 && (
                <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', padding: '20px 20px' }}>
                  {t('noMatch')}
                </p>
              )}
            </>
          )}
        </div>
      ) : null}

      {!isSearchFocused && !searchQuery.trim() && (
        <>
          {/* タイムラインタイトル＋フィルターボタン */}
          {subscribedFaces.length > 0 && (
            <div
              style={{
                padding: '10px 18px 20px',
                borderBottom: '0.5px solid var(--mf-line)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'var(--mf-bg-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
                {t('sectionTitle')}
              </p>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFaceFilter((p) => !p);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: selectedFaceId ? 'var(--mf-brand)' : 'var(--mf-surface)',
                    border: `1px solid ${selectedFaceId ? 'var(--mf-brand)' : 'var(--mf-line)'}`,
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: selectedFaceId ? '#fff' : 'var(--mf-text-sub)',
                  }}
                >
                  <svg
                    width={13}
                    height={13}
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 3h12M3 7h8M5 11h4" />
                  </svg>
                  {selectedFaceId ? getFaceTitle(faceMap.get(selectedFaceId)!) : t('filterByFace')}
                  {selectedFaceId && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFaceId(null);
                        setSeedPage(1);
                      }}
                      style={{ display: 'flex', alignItems: 'center', marginLeft: 2, opacity: 0.8 }}
                    >
                      <svg
                        width={12}
                        height={12}
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                      >
                        <path d="M2 2l8 8M10 2L2 10" />
                      </svg>
                    </span>
                  )}
                </button>

                {showFaceFilter && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% - 4px)',
                      left: 18,
                      zIndex: 30,
                      background: 'var(--mf-surface)',
                      borderRadius: 12,
                      border: '0.5px solid var(--mf-line)',
                      boxShadow: '0 8px 24px rgba(30,42,74,0.12)',
                      overflow: 'hidden',
                      minWidth: 200,
                    }}
                  >
                    {subscribedFaces.map((face) => {
                      const isSelected = selectedFaceId === face.id;
                      const hasUnread = seeds.some((a) => a.faceId === face.id);
                      return (
                        <button
                          key={face.id}
                          type="button"
                          onClick={() => {
                            setSelectedFaceId(isSelected ? null : face.id);
                            setShowFaceFilter(false);
                            setSeedPage(1);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 14px',
                            background: isSelected ? 'var(--mf-hover)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              flexShrink: 0,
                              boxShadow:
                                hasUnread && !isSelected
                                  ? '0 0 0 2px var(--mf-surface), 0 0 0 3px var(--mf-accent)'
                                  : 'none',
                              borderRadius: 9,
                            }}
                          >
                            <FaceBadge face={face} size={32} radius={9} />
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--mf-brand)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {getFaceTitle(face)}
                          </span>
                          {isSelected && (
                            <svg
                              width={14}
                              height={14}
                              viewBox="0 0 14 14"
                              fill="none"
                              stroke="var(--mf-accent)"
                              strokeWidth={2}
                              strokeLinecap="round"
                              style={{ marginLeft: 'auto' }}
                            >
                              <path d="M2 7l4 4 6-7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* タイムライン */}
          {subscribedFaces.length === 0 ? (
            <EmptyState />
          ) : filteredSeeds.length === 0 ? (
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
              <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>{t('noFilteredSeeds')}</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '0 28px' }}>
                {pagedFilteredSeeds.map((act) => {
                  const face = faceMap.get(act.faceId);
                  if (!face) return null;
                  return (
                    <SeedRow
                      key={act.id}
                      seed={act}
                      face={face}
                      currentUserId={currentUserId}
                      onMoreOptions={openSeedActionMenu}
                      onClick={() => router.push(`/seeds/${act.id}`)}
                    />
                  );
                })}
              </div>
              <Pagination
                currentPage={seedPage}
                totalPages={seedTotalPages}
                onPageChange={setSeedPage}
              />
            </>
          )}
        </>
      )}

      {/* シードアクションドロップダウン */}
      {seedActionMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setSeedActionMenu(null)}
            aria-hidden="true"
          />
          <div
            role="menu"
            style={{
              position: 'fixed',
              top: seedActionMenu.top,
              right: seedActionMenu.right,
              zIndex: 50,
              minWidth: 180,
              borderRadius: 12,
              background: 'var(--mf-bg-light)',
              border: '0.5px solid var(--mf-line)',
              boxShadow: '0 8px 32px rgba(30,42,74,0.18)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 16px 8px', borderBottom: '0.5px solid var(--mf-line)' }}>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--mf-text-muted)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}
              >
                {seedActionMenu.seed.body.slice(0, 30)}
                {seedActionMenu.seed.body.length > 30 ? '…' : ''}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setEditingSeed(seedActionMenu.seed);
                setSeedActionMenu(null);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: '0.5px solid var(--mf-line)',
                cursor: 'pointer',
                color: 'var(--mf-text)',
                textAlign: 'left',
              }}
            >
              <svg
                width={15}
                height={15}
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
              </svg>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{tSeed('editSeed')}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDeletingSeed(seedActionMenu.seed);
                setSeedActionMenu(null);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--mf-danger, #e53e3e)',
                textAlign: 'left',
              }}
            >
              <svg
                width={15}
                height={15}
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3.5h10M5.5 3.5V2h3v1.5M3.5 3.5l.7 8h5.6l.7-8" />
              </svg>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{tSeed('deleteSeed')}</span>
            </button>
          </div>
        </>
      )}

      {/* シード編集モーダル */}
      {editingSeed && (
        <EditSeedModal
          isOpen={true}
          seed={editingSeed}
          onClose={() => setEditingSeed(null)}
          onUpdate={(updated) => {
            handleSeedUpdate(updated);
            setEditingSeed(null);
          }}
        />
      )}

      {/* シード削除確認ダイアログ */}
      {deletingSeed && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(20,24,36,0.50)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => {
              if (!isDeleting) setDeletingSeed(null);
            }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 50,
              width: 'calc(100% - 2rem)',
              maxWidth: 320,
              borderRadius: 18,
              background: 'var(--mf-bg-light)',
              border: '0.5px solid var(--mf-line)',
              boxShadow: '0 20px 60px rgba(30,42,74,0.18)',
              padding: '24px 20px 20px',
            }}
          >
            <h2
              style={{ fontSize: 15, fontWeight: 700, color: 'var(--mf-brand)', margin: '0 0 8px' }}
            >
              {tSeed('deleteConfirmTitle')}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--mf-text-sub)',
                margin: '0 0 20px',
                lineHeight: 1.6,
              }}
            >
              {tSeed('deleteConfirmMessage')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeletingSeed(null)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  border: '0.5px solid var(--mf-line)',
                  background: 'none',
                  color: 'var(--mf-text)',
                  cursor: 'pointer',
                }}
              >
                {tSeed('deleteCancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSeedDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  border: 'none',
                  background: 'var(--mf-danger, #e53e3e)',
                  color: '#fff',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? tSeed('deleting') : tSeed('deleteConfirmButton')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SubscriptionSeed;
