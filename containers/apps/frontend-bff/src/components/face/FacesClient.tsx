'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Face } from '@/types/face';
import type { Seed } from '@/types/seed';
import { getFaceTitle, getFaceColor, getFaceKanji, createLookupMap } from '@/lib/display';
import CreateFaceModal from './CreateFaceModal';
import EditFaceModal from './EditFaceModal';
import SeedRow from '@/components/ui/SeedRow';
import Pagination from '@/components/ui/Pagination';
import EditSeedModal from '@/components/seed/EditSeedModal';
import { deleteFaceAction } from '@/server/actions/faces';
import { deleteSeedAction } from '@/server/actions/seeds';
import { useTranslations } from 'next-intl';

type Props = {
  initialFaces: Face[];
  seeds: Seed[];
  currentUserId?: string;
};

type SortType = 'lastAt' | 'total' | 'name';
type ViewType = 'grid' | 'list';
type ActionMenu = { face: Face; top: number; right: number };
type SeedActionMenu = { seed: Seed; top: number; right: number };

const REFERENCE_MONTH = '2026-04';

const FacesClient = ({ initialFaces, seeds: initialSeeds, currentUserId }: Props) => {
  const router = useRouter();
  const [faces, setFaces] = useState<Face[]>(initialFaces);
  const [seeds, setSeeds] = useState(initialSeeds);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState<ActionMenu | null>(null);
  const [seedActionMenu, setSeedActionMenu] = useState<SeedActionMenu | null>(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [deletingSeed, setDeletingSeed] = useState<Seed | null>(null);

  const openActionMenu = (e: React.MouseEvent<HTMLButtonElement>, face: Face) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight + 4 ? rect.bottom + 4 : rect.top - menuHeight - 4;
    setActionMenu({ face, top, right: window.innerWidth - rect.right });
  };

  const openSeedActionMenu = (e: React.MouseEvent<HTMLButtonElement>, seed: Seed) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight + 4 ? rect.bottom + 4 : rect.top - menuHeight - 4;
    setSeedActionMenu({ seed, top, right: window.innerWidth - rect.right });
  };

  const [editingFace, setEditingFace] = useState<Face | null>(null);
  const [deletingFace, setDeletingFace] = useState<Face | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isDeletingSeed, startSeedDeleteTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [seedsPage, setSeedsPage] = useState(1);
  const [sortType, setSortType] = useState<SortType>('lastAt');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const t = useTranslations('facesClient');
  const tSeed = useTranslations('seedActions');

  const handleCreate = (newFace: Face) => {
    setFaces((prev) => [newFace, ...prev]);
  };

  const handleUpdate = (updatedFace: Face) => {
    setFaces((prev) => prev.map((f) => (f.id === updatedFace.id ? updatedFace : f)));
  };

  const handleConfirmDelete = () => {
    if (!deletingFace || isDeleting) return;
    const faceId = deletingFace.id;
    startDeleteTransition(async () => {
      await deleteFaceAction(faceId);
      setFaces((prev) => prev.filter((f) => f.id !== faceId));
      setDeletingFace(null);
    });
  };

  const handleSeedUpdate = (updatedSeed: Seed) => {
    setSeeds((prev) => prev.map((s) => (s.id === updatedSeed.id ? updatedSeed : s)));
  };

  const handleConfirmSeedDelete = () => {
    if (!deletingSeed || isDeletingSeed) return;
    const seedId = deletingSeed.id;
    startSeedDeleteTransition(async () => {
      await deleteSeedAction(seedId);
      setSeeds((prev) => prev.filter((s) => s.id !== seedId));
      setDeletingSeed(null);
    });
  };

  const faceStats = useMemo(() => {
    const stats = new Map<string, { total: number; monthly: number; lastDate: string | null }>();
    for (const face of faces) {
      const faceSeeds = seeds.filter((a) => a.faceId === face.id);
      const monthly = faceSeeds.filter((a) => a.createdAt.startsWith(REFERENCE_MONTH)).length;
      const sorted = [...faceSeeds].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      stats.set(face.id, {
        total: faceSeeds.length,
        monthly,
        lastDate: sorted[0]?.createdAt.slice(0, 10) ?? null,
      });
    }
    return stats;
  }, [faces, seeds]);

  const SORT_LABELS: Record<SortType, string> = {
    lastAt: t('sortLastAt'),
    total: t('sortTotal'),
    name: t('sortName'),
  };

  const filteredFaces = useMemo(() => {
    let result = [...faces];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) => getFaceTitle(f).toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const sa = faceStats.get(a.id);
      const sb = faceStats.get(b.id);
      if (sortType === 'lastAt') {
        return (sb?.lastDate ?? '').localeCompare(sa?.lastDate ?? '');
      }
      if (sortType === 'total') {
        return (sb?.total ?? 0) - (sa?.total ?? 0);
      }
      return getFaceTitle(a).localeCompare(getFaceTitle(b), 'ja');
    });
    return result;
  }, [faces, faceStats, searchQuery, sortType]);

  const faceMap = useMemo(() => createLookupMap(faces, (f) => f.id), [faces]);

  const matchingSeeds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const faceIds = new Set(faces.map((f) => f.id));
    return seeds.filter((a) => faceIds.has(a.faceId) && a.body.toLowerCase().includes(q));
  }, [searchQuery, faces, seeds]);

  const SEEDS_PAGE_SIZE = 10;
  const seedsTotalPages = Math.ceil(matchingSeeds.length / SEEDS_PAGE_SIZE);
  const pagedMatchingSeeds = matchingSeeds.slice(
    (seedsPage - 1) * SEEDS_PAGE_SIZE,
    seedsPage * SEEDS_PAGE_SIZE
  );

  return (
    <main style={{ display: 'flex', flexDirection: 'column', paddingBottom: 24 }}>
      {/* 検索バー */}
      <div style={{ padding: '20px 18px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--mf-surface)',
            borderRadius: 12,
            border: '0.5px solid var(--mf-line)',
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            stroke="var(--mf-text-muted)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx={6.5} cy={6.5} r={4.5} />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSeedsPage(1);
            }}
            placeholder={t('searchPlaceholder')}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 13.5,
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
      </div>

      {/* 検索結果 */}
      {searchQuery.trim() && (
        <div style={{ padding: '0 0 16px' }}>
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
              {t('facesSection', { n: filteredFaces.length })}
            </span>
          </div>
          {filteredFaces.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', padding: '4px 20px' }}>
              {t('noMatch')}
            </p>
          ) : (
            <div
              style={{
                padding: '0 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              {filteredFaces.map((face) => {
                const stats = faceStats.get(face.id);
                const color = getFaceColor(face.id);
                return (
                  <Link key={face.id} href={`/faces/${face.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        height: 200,
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
                          height: 130,
                          flexShrink: 0,
                          background: face.image?.url ? undefined : color,
                          backgroundImage: face.image?.url ? `url(${face.image.url})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          padding: 10,
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {face.visibility === 'private' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              padding: '3px 7px',
                              background: 'rgba(20,24,36,0.32)',
                              borderRadius: 999,
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                            }}
                          >
                            <svg
                              width={10}
                              height={10}
                              viewBox="0 0 14 14"
                              fill="none"
                              stroke="#fff"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x={2.5} y={6} width={9} height={6.5} rx={1.2} />
                              <path d="M4.5 6V4a2.5 2.5 0 015 0v2" />
                            </svg>
                            <span
                              style={{
                                fontSize: 9,
                                color: '#fff',
                                fontWeight: 700,
                                letterSpacing: 0.3,
                              }}
                            >
                              {t('private')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          padding: '11px 13px 12px',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: 'var(--mf-brand)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {getFaceTitle(face)}
                          </div>
                          <button
                            type="button"
                            aria-label={t('actionMenu')}
                            onClick={(e) => openActionMenu(e, face)}
                            style={{
                              width: 22,
                              height: 22,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--mf-text-muted)',
                              borderRadius: 6,
                              flexShrink: 0,
                            }}
                          >
                            <svg width={3} height={13} viewBox="0 0 3 13" fill="currentColor">
                              <circle cx={1.5} cy={1.5} r={1.5} />
                              <circle cx={1.5} cy={6.5} r={1.5} />
                              <circle cx={1.5} cy={11.5} r={1.5} />
                            </svg>
                          </button>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ fontSize: 10.5, color: 'var(--mf-text-muted)' }}>
                            {stats?.lastDate ? stats.lastDate.replace(/-/g, '/') : '—'}
                          </div>
                          <span style={{ flexShrink: 0, textAlign: 'right' }}>
                            <b style={{ color: 'var(--mf-text)', fontWeight: 700, fontSize: 17 }}>
                              {stats?.total ?? 0}
                            </b>
                            <span
                              style={{ fontSize: 10, color: 'var(--mf-text-muted)', marginLeft: 2 }}
                            >
                              {t('seedCount', { count: stats?.total ?? 0 })}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
              {t('seedsSection', { n: matchingSeeds.length })}
            </span>
          </div>
          {matchingSeeds.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', padding: '4px 20px' }}>
              {t('noMatch')}
            </p>
          ) : (
            <>
              <div style={{ padding: '0 20px' }}>
                {pagedMatchingSeeds.map((act) => {
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
                currentPage={seedsPage}
                totalPages={seedsTotalPages}
                onPageChange={setSeedsPage}
              />
            </>
          )}
        </div>
      )}

      {!searchQuery.trim() && (
        <>
          {/* ソートコントロール */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 20px 12px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowSortMenu((p) => !p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12.5,
                  color: 'var(--mf-text-sub)',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                {SORT_LABELS[sortType]}
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                >
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>
              {showSortMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    zIndex: 20,
                    background: 'var(--mf-surface)',
                    borderRadius: 10,
                    border: '0.5px solid var(--mf-line)',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(30,42,74,0.12)',
                    minWidth: 140,
                  }}
                >
                  {(Object.entries(SORT_LABELS) as [SortType, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSortType(key);
                        setShowSortMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: 13,
                        fontWeight: sortType === key ? 700 : 400,
                        color: sortType === key ? 'var(--mf-brand)' : 'var(--mf-text)',
                        background: sortType === key ? 'var(--mf-hover)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* グリッド/リスト切替 */}
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                type="button"
                onClick={() => setViewType('grid')}
                aria-label={t('gridView')}
                style={{
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 7,
                  background: viewType === 'grid' ? 'var(--mf-brand)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: viewType === 'grid' ? '#fff' : 'var(--mf-text-muted)',
                }}
              >
                <svg width={14} height={14} viewBox="0 0 14 14" fill="currentColor">
                  <rect x={0} y={0} width={6} height={6} rx={1} />
                  <rect x={8} y={0} width={6} height={6} rx={1} />
                  <rect x={0} y={8} width={6} height={6} rx={1} />
                  <rect x={8} y={8} width={6} height={6} rx={1} />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewType('list')}
                aria-label={t('listView')}
                style={{
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 7,
                  background: viewType === 'list' ? 'var(--mf-brand)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: viewType === 'list' ? '#fff' : 'var(--mf-text-muted)',
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
                  <path d="M2 3h10M2 7h10M2 11h10" />
                </svg>
              </button>
            </div>
          </div>

          {faces.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                padding: '80px 0',
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>{t('noFaces')}</p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 10,
                  background: 'var(--mf-brand)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('createFirstFace')}
              </button>
            </div>
          ) : filteredFaces.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>
                {t('noFilteredFaces', { query: searchQuery })}
              </p>
            </div>
          ) : viewType === 'grid' ? (
            <div
              style={{
                padding: '0 20px 32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              {filteredFaces.map((face) => {
                const color = getFaceColor(face.id);
                const stats = faceStats.get(face.id);
                return (
                  <Link key={face.id} href={`/faces/${face.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        height: 200,
                        borderRadius: 14,
                        overflow: 'hidden',
                        background: 'var(--mf-surface)',
                        border: '0.5px solid var(--mf-line)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          height: 130,
                          background: face.image?.url ? undefined : color,
                          backgroundImage: face.image?.url ? `url(${face.image.url})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          padding: 10,
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-end',
                          flexShrink: 0,
                        }}
                      >
                        {face.visibility === 'private' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              padding: '3px 7px',
                              background: 'rgba(20,24,36,0.32)',
                              borderRadius: 999,
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                            }}
                          >
                            <svg
                              width={10}
                              height={10}
                              viewBox="0 0 14 14"
                              fill="none"
                              stroke="#fff"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x={2.5} y={6} width={9} height={6.5} rx={1.2} />
                              <path d="M4.5 6V4a2.5 2.5 0 015 0v2" />
                            </svg>
                            <span
                              style={{
                                fontSize: 9,
                                color: '#fff',
                                fontWeight: 700,
                                letterSpacing: 0.3,
                              }}
                            >
                              {t('private')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          padding: '11px 13px 12px',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: 'var(--mf-brand)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              letterSpacing: 0.1,
                              lineHeight: 1.2,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {getFaceTitle(face)}
                          </div>
                          <button
                            type="button"
                            aria-label={t('actionMenu')}
                            onClick={(e) => openActionMenu(e, face)}
                            style={{
                              width: 22,
                              height: 22,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--mf-text-muted)',
                              borderRadius: 6,
                              flexShrink: 0,
                            }}
                          >
                            <svg width={3} height={13} viewBox="0 0 3 13" fill="currentColor">
                              <circle cx={1.5} cy={1.5} r={1.5} />
                              <circle cx={1.5} cy={6.5} r={1.5} />
                              <circle cx={1.5} cy={11.5} r={1.5} />
                            </svg>
                          </button>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ fontSize: 10.5, color: 'var(--mf-text-muted)' }}>
                            {stats?.lastDate ? stats.lastDate.replace(/-/g, '/') : '—'}
                          </div>
                          <span style={{ flexShrink: 0, textAlign: 'right' }}>
                            <b style={{ color: 'var(--mf-text)', fontWeight: 700, fontSize: 17 }}>
                              {stats?.total ?? 0}
                            </b>
                            <span
                              style={{ fontSize: 10, color: 'var(--mf-text-muted)', marginLeft: 2 }}
                            >
                              {t('seedCount', { count: stats?.total ?? 0 })}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* 新規フェイス作成カード */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  height: 156,
                  borderRadius: 14,
                  border: '1.5px dashed var(--mf-line)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  color: 'var(--mf-text-muted)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <svg
                  width={24}
                  height={24}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <path d="M10 4v12M4 10h12" />
                </svg>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t('createNewCard')}</div>
              </button>
            </div>
          ) : (
            /* リストビュー */
            <div style={{ padding: '0 0 32px' }}>
              {filteredFaces.map((face, i) => {
                const color = getFaceColor(face.id);
                const stats = faceStats.get(face.id);
                return (
                  <Link key={face.id} href={`/faces/${face.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 20px',
                        borderBottom:
                          i < filteredFaces.length - 1 ? '0.5px solid var(--mf-line-soft)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          flexShrink: 0,
                          background: face.image?.url ? undefined : color,
                          backgroundImage: face.image?.url ? `url(${face.image.url})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: face.image?.url ? 'block' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!face.image?.url && (
                          <span
                            style={{
                              fontFamily: 'var(--mf-font-serif)',
                              fontSize: 18,
                              fontWeight: 600,
                              color: '#fff',
                            }}
                          >
                            {getFaceKanji(getFaceTitle(face))}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
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
                        {face.description && (
                          <div
                            style={{
                              fontSize: 11.5,
                              color: 'var(--mf-text-sub)',
                              marginTop: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {face.description}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--mf-brand)' }}>
                          {stats?.total ?? 0}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--mf-text-muted)' }}>
                          {t('seedCount', { count: stats?.total ?? 0 })}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={t('actionMenu')}
                        onClick={(e) => openActionMenu(e, face)}
                        style={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--mf-text-muted)',
                          borderRadius: 8,
                          flexShrink: 0,
                          marginLeft: 10,
                        }}
                      >
                        <svg width={3} height={13} viewBox="0 0 3 13" fill="currentColor">
                          <circle cx={1.5} cy={1.5} r={1.5} />
                          <circle cx={1.5} cy={6.5} r={1.5} />
                          <circle cx={1.5} cy={11.5} r={1.5} />
                        </svg>
                      </button>
                    </div>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mf-text-muted)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: '1.5px dashed var(--mf-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                  >
                    <path d="M10 4v12M4 10h12" />
                  </svg>
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t('createNewCard')}</span>
              </button>
            </div>
          )}
        </>
      )}

      <CreateFaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />

      {/* ケバブドロップダウン */}
      {actionMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setActionMenu(null)}
            aria-hidden="true"
          />
          <div
            role="menu"
            style={{
              position: 'fixed',
              top: actionMenu.top,
              right: actionMenu.right,
              zIndex: 50,
              minWidth: 180,
              borderRadius: 12,
              background: 'var(--mf-bg-light)',
              border: '0.5px solid var(--mf-line)',
              boxShadow: '0 8px 32px rgba(30,42,74,0.18)',
              overflow: 'hidden',
            }}
          >
            {/* フェイス名ヘッダー */}
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
                {getFaceTitle(actionMenu.face)}
              </p>
            </div>

            {/* 編集ボタン */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setEditingFace(actionMenu.face);
                setActionMenu(null);
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
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t('editFace')}</span>
            </button>

            {/* 削除ボタン */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDeletingFace(actionMenu.face);
                setActionMenu(null);
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
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t('deleteFace')}</span>
            </button>
          </div>
        </>
      )}

      {editingFace && (
        <EditFaceModal
          isOpen={true}
          face={editingFace}
          onClose={() => setEditingFace(null)}
          onUpdate={(updated) => {
            handleUpdate(updated);
            setEditingFace(null);
          }}
        />
      )}

      {deletingFace && (
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
              if (!isDeleting) setDeletingFace(null);
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
              maxWidth: 360,
              borderRadius: 18,
              background: 'var(--mf-bg-light)',
              border: '0.5px solid var(--mf-line)',
              boxShadow: '0 20px 60px rgba(30,42,74,0.18)',
              padding: '24px 20px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
              {t('deleteConfirmTitle')}
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--mf-text-sub)', margin: 0, lineHeight: 1.6 }}>
              {t('deleteConfirmMessage', { name: getFaceTitle(deletingFace) })}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeletingFace(null)}
                disabled={isDeleting}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  background: 'var(--mf-surface)',
                  border: '0.5px solid var(--mf-line)',
                  color: 'var(--mf-text)',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {t('deleteCancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  background: isDeleting ? 'var(--mf-surface-tint)' : 'var(--mf-danger, #e53e3e)',
                  border: 'none',
                  color: isDeleting ? 'var(--mf-text-faint)' : '#fff',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? t('deleting') : t('deleteConfirmButton')}
              </button>
            </div>
          </div>
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
              if (!isDeletingSeed) setDeletingSeed(null);
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
                disabled={isDeletingSeed}
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
                disabled={isDeletingSeed}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  border: 'none',
                  background: 'var(--mf-danger, #e53e3e)',
                  color: '#fff',
                  cursor: isDeletingSeed ? 'not-allowed' : 'pointer',
                  opacity: isDeletingSeed ? 0.7 : 1,
                }}
              >
                {isDeletingSeed ? tSeed('deleting') : tSeed('deleteConfirmButton')}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default FacesClient;
