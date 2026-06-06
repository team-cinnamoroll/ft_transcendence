'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { useTranslations } from 'next-intl';
import SeedRow from '@/components/ui/SeedRow';
import DateBar from '@/components/ui/DateBar';
import FaceBadge from '@/components/ui/FaceBadge';
import { createLookupMap, getFaceTitle, getFaceColor } from '@/lib/display';

type Tab = 'timeline' | 'subscriptions';

const RECOMMENDED_FACES = [
  { color: '#5B8DB8', kanji: '読', name: '読書',    handle: 'h_maru',     subs: 412, desc: '読みながら考えたこと' },
  { color: '#7B6B9E', kanji: '映', name: '映画断片', handle: 'sayaka_t',   subs: 287, desc: '観終わってからしばらく' },
  { color: '#A89050', kanji: '珈', name: '朝の珈琲', handle: 'kettle_co',  subs: 198, desc: '一杯目のメモ' },
  { color: '#B06B7A', kanji: '夜', name: '夜更けに', handle: 'yorunoyoru', subs: 156, desc: '23時以降のひとりごと' },
];

const EmptyState = () => (
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
          position: 'absolute', top: -50, right: -50,
          width: 140, height: 140, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(248,246,241,0.18) 0%, rgba(248,246,241,0.04) 60%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--mf-accent)' }} />
        <div style={{ fontSize: 10.5, color: 'var(--mf-accent)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
          Quiet Feed
        </div>
      </div>
      <div style={{ fontSize: 17, lineHeight: 1.55, fontWeight: 700, color: '#F8F6F1', letterSpacing: 0.2, position: 'relative' }}>
        まだ、誰のフェイスも<br />サブスクライブしていない。
      </div>
      <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.7, color: 'rgba(248,246,241,0.7)', position: 'relative' }}>
        気になるフェイスを1つだけ、まず選んでみる。<br />
        通知の重みを大切にする設計です。
      </div>
    </div>

    {/* おすすめのフェイス */}
    <div style={{ marginTop: 20 }}>
      <div style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mf-brand)', letterSpacing: 0.2 }}>おすすめのフェイス</div>
        <div style={{ fontSize: 11, color: 'var(--mf-text-muted)' }}>· あなたに合いそうな</div>
      </div>
      {RECOMMENDED_FACES.map((r, i) => (
        <div
          key={r.handle}
          style={{
            padding: '12px 18px',
            borderBottom: i < RECOMMENDED_FACES.length - 1 ? '0.5px solid var(--mf-line-soft)' : 'none',
            display: 'flex', gap: 12, alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 42, height: 42, borderRadius: 11,
              background: r.color, color: '#fff',
              fontFamily: 'var(--mf-font-serif)', fontSize: 20, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {r.kanji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mf-brand)' }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>@{r.handle}</div>
            </div>
            <div style={{ marginTop: 2, fontSize: 11.5, color: 'var(--mf-text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.desc} · {r.subs} サブスク
            </div>
          </div>
          <button
            type="button"
            style={{
              padding: '7px 14px', borderRadius: 999,
              background: i === 0 ? 'var(--mf-brand)' : 'transparent',
              border: i === 0 ? 'none' : '1px solid var(--mf-brand)',
              color: i === 0 ? '#F8F6F1' : 'var(--mf-brand)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            サブスク
          </button>
        </div>
      ))}
    </div>
  </div>
);

type Props = {
  subscribedFaceIds: string[];
  subscribedActivities: Activity[];
  faces: Face[];
  users: UserProfile[];
};

const SubscriptionFeed = ({ subscribedFaceIds, subscribedActivities, faces, users: _users }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [showFaceFilter, setShowFaceFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const t = useTranslations('subscriptionFeed');

  const subscribedFaces = useMemo(
    () => faces.filter((f) => subscribedFaceIds.includes(f.id)),
    [faces, subscribedFaceIds]
  );

  const faceMap = useMemo(() => createLookupMap(subscribedFaces, (face) => face.id), [subscribedFaces]);

  const filteredActivities = useMemo(() => {
    let result = selectedFaceId
      ? subscribedActivities.filter((a) => a.faceId === selectedFaceId)
      : subscribedActivities;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => {
        const face = faceMap.get(a.faceId);
        return (
          a.body.toLowerCase().includes(q) ||
          (face && getFaceTitle(face).toLowerCase().includes(q))
        );
      });
    }
    return result;
  }, [subscribedActivities, selectedFaceId, searchQuery, faceMap]);

  const matchingFaces = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return subscribedFaces.filter(
      (f) =>
        getFaceTitle(f).toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q)
    );
  }, [searchQuery, subscribedFaces]);

  const matchingSeeds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return subscribedActivities.filter((a) => a.body.toLowerCase().includes(q));
  }, [searchQuery, subscribedActivities]);

  // タイムラインを日付でグループ化
  const grouped = useMemo(() => {
    const groups: { dateKey: string; activities: Activity[] }[] = [];
    let lastKey = '';
    for (const act of filteredActivities) {
      const dateKey = act.createdAt.slice(0, 10);
      if (dateKey !== lastKey) {
        groups.push({ dateKey, activities: [act] });
        lastKey = dateKey;
      } else {
        groups[groups.length - 1].activities.push(act);
      }
    }
    return groups;
  }, [filteredActivities]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'timeline', label: t('timelineTab') },
    { key: 'subscriptions', label: t('subscriptionsTab') },
  ];

  return (
    <div onClick={() => setShowFaceFilter(false)}>
      {/* 検索バー */}
      <div style={{ padding: '20px 18px 14px' }}>
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
          <svg width={16} height={16} viewBox="0 0 18 18" fill="none" stroke="var(--mf-text-muted)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={8} cy={8} r={5.5} /><path d="M12.2 12.2L16 16" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mf-text-muted)', padding: 0 }}
            >
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* タブ */}
      <div
        style={{
          display: 'flex',
          borderBottom: '0.5px solid var(--mf-line)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--mf-bg-light)',
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            style={{
              padding: '11px 14px',
              fontSize: 13.5,
              fontWeight: activeTab === key ? 700 : 600,
              color: activeTab === key ? 'var(--mf-brand)' : 'var(--mf-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === key ? '2.5px solid var(--mf-accent)' : '2.5px solid transparent',
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {label}
            {activeTab === key && (
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--mf-accent)' }} />
            )}
          </button>
        ))}
      </div>

      {/* 検索結果 */}
      {searchQuery.trim() ? (
        <div style={{ paddingBottom: 16 }}>
          {/* フェイス結果 */}
          <div style={{ padding: '12px 20px 6px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mf-text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {t('facesSection', { n: matchingFaces.length })}
            </span>
          </div>
          {matchingFaces.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', padding: '4px 20px' }}>{t('noMatch')}</p>
          ) : (
            <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {matchingFaces.map((face) => {
                const seedCount = subscribedActivities.filter((a) => a.faceId === face.id).length;
                const lastAct = subscribedActivities.find((a) => a.faceId === face.id);
                const color = getFaceColor(face.id);
                return (
                  <Link key={face.id} href={`/faces/${face.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ height: 200, borderRadius: 14, overflow: 'hidden', background: 'var(--mf-surface)', border: '0.5px solid var(--mf-line)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: 130, flexShrink: 0, background: face.imageUrl ? undefined : color, backgroundImage: face.imageUrl ? `url(${face.imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div style={{ padding: '11px 13px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--mf-brand)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                            {getFaceTitle(face)}
                          </div>
                          <span style={{ flexShrink: 0 }}>
                            <b style={{ color: 'var(--mf-text)', fontWeight: 700, fontSize: 17 }}>{seedCount}</b>
                            <span style={{ fontSize: 10, color: 'var(--mf-text-muted)', marginLeft: 2 }}>{t('seedCount')}</span>
                          </span>
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--mf-text-muted)' }}>
                          {lastAct?.createdAt.slice(0, 10).replace(/-/g, '/') ?? '—'}
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
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mf-text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {t('seedsSection', { n: matchingSeeds.length })}
            </span>
          </div>
          {matchingSeeds.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--mf-text-muted)', padding: '4px 20px' }}>{t('noMatch')}</p>
          ) : (
            <div style={{ padding: '0 20px' }}>
              {matchingSeeds.map((act) => {
                const face = faceMap.get(act.faceId);
                if (!face) return null;
                return <SeedRow key={act.id} activity={act} face={face} />;
              })}
            </div>
          )}
        </div>
      ) : null}

      {!searchQuery.trim() && activeTab === 'timeline' && (
        <>
          {/* フィルターボタン */}
          {subscribedFaces.length > 0 && (
            <div style={{ padding: '10px 18px 8px', borderBottom: '0.5px solid var(--mf-line)', position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowFaceFilter((p) => !p); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 999,
                  background: selectedFaceId ? 'var(--mf-brand)' : 'var(--mf-surface)',
                  border: `1px solid ${selectedFaceId ? 'var(--mf-brand)' : 'var(--mf-line)'}`,
                  cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                  color: selectedFaceId ? '#fff' : 'var(--mf-text-sub)',
                }}
              >
                <svg width={13} height={13} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3h12M3 7h8M5 11h4" />
                </svg>
                {selectedFaceId
                  ? getFaceTitle(faceMap.get(selectedFaceId)!)
                  : t('filterByFace')}
                {selectedFaceId && (
                  <span
                    onClick={(e) => { e.stopPropagation(); setSelectedFaceId(null); }}
                    style={{ display: 'flex', alignItems: 'center', marginLeft: 2, opacity: 0.8 }}
                  >
                    <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                      <path d="M2 2l8 8M10 2L2 10" />
                    </svg>
                  </span>
                )}
              </button>

              {showFaceFilter && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: 'calc(100% - 4px)', left: 18, zIndex: 30,
                    background: 'var(--mf-surface)', borderRadius: 12,
                    border: '0.5px solid var(--mf-line)',
                    boxShadow: '0 8px 24px rgba(30,42,74,0.12)', overflow: 'hidden', minWidth: 200,
                  }}
                >
                  {subscribedFaces.map((face) => {
                    const isSelected = selectedFaceId === face.id;
                    const hasUnread = subscribedActivities.some((a) => a.faceId === face.id);
                    return (
                      <button
                        key={face.id}
                        type="button"
                        onClick={() => { setSelectedFaceId(isSelected ? null : face.id); setShowFaceFilter(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 14px', background: isSelected ? 'var(--mf-hover)' : 'transparent',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <div style={{
                          position: 'relative', flexShrink: 0,
                          boxShadow: hasUnread && !isSelected ? '0 0 0 2px var(--mf-surface), 0 0 0 3px var(--mf-accent)' : 'none',
                          borderRadius: 9,
                        }}>
                          <FaceBadge face={face} size={32} radius={9} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-brand)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getFaceTitle(face)}
                        </span>
                        {isSelected && (
                          <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="var(--mf-accent)" strokeWidth={2} strokeLinecap="round" style={{ marginLeft: 'auto' }}>
                            <path d="M2 7l4 4 6-7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* タイムライン */}
          {subscribedFaces.length === 0 ? (
            <EmptyState />
          ) : grouped.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>{t('noFilteredActivities')}</p>
            </div>
          ) : (
            grouped.map(({ dateKey, activities }) => (
              <div key={dateKey}>
                <DateBar label={dateKey} date={dateKey.replace(/-/g, '/')} />
                <div style={{ padding: '0 28px' }}>
                  {activities.map((act) => {
                    const face = faceMap.get(act.faceId);
                    if (!face) return null;
                    return <SeedRow key={act.id} activity={act} face={face} />;
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {!searchQuery.trim() && activeTab === 'subscriptions' && (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {subscribedFaces.length === 0 ? (
            <EmptyState />
          ) : (
            subscribedFaces.map((face) => {
              const seedCount = subscribedActivities.filter((a) => a.faceId === face.id).length;
              return (
                <Link key={face.id} href={`/faces/${face.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--mf-surface)', border: '0.5px solid var(--mf-line)' }}>
                    <FaceBadge face={face} size={44} radius={12} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mf-brand)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getFaceTitle(face)}
                      </div>
                      {face.description && (
                        <div style={{ fontSize: 11.5, color: 'var(--mf-text-sub)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {face.description}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--mf-brand)' }}>{seedCount}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--mf-text-muted)' }}>{t('seedCount')}</div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionFeed;
