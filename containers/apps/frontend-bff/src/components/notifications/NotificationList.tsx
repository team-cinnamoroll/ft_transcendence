'use client';

import { useState, useMemo } from 'react';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import { type Notification } from '@/types/notification';
import { useRelativeTime } from '@/lib/use-relative-time';
import { createLookupMap, getFaceTitle } from '@/lib/display';
import { useTranslations } from 'next-intl';
import FaceBadge from '@/components/ui/FaceBadge';
import DateBar from '@/components/ui/DateBar';

type FilterType = 'all' | 'sub' | 'link';

const UNREAD_CUTOFF = '2026-03-25';

type NotifItemProps = {
  notification: Notification;
  faceName?: string;
  faceId?: string;
  faceImageUrl?: string | null;
  preview: string;
  typeLinkLabel: string;
  typeUpdateLabel: string;
};

const NotifItem = ({
  notification,
  faceName,
  faceId,
  faceImageUrl,
  preview,
  typeLinkLabel,
  typeUpdateLabel,
}: NotifItemProps) => {
  const relativeTime = useRelativeTime();
  const isUnread = notification.createdAt >= UNREAD_CUTOFF;
  const isLink = notification.type === 'link';

  const typeMeta = isLink
    ? { label: typeLinkLabel, bg: 'rgba(30,42,74,0.10)', color: 'var(--mf-brand)' }
    : { label: typeUpdateLabel, bg: 'rgba(212,146,42,0.10)', color: 'var(--mf-accent)' };

  const mockFace = faceId
    ? {
        id: faceId,
        name: faceName ?? '',
        userId: '',
        visibility: 'public' as const,
        emoji: null,
        description: null,
        image: faceImageUrl ? { id: 'mock', url: faceImageUrl } : null,
      }
    : null;

  return (
    <div
      style={{
        padding: '12px 18px',
        background: isUnread ? 'rgba(212,146,42,0.05)' : 'transparent',
        borderBottom: '0.5px solid var(--mf-line-soft)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        position: 'relative',
      }}
    >
      {isUnread && (
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--mf-accent)',
          }}
        />
      )}

      {/* フェイスバッジ */}
      {mockFace ? (
        <div style={{ flexShrink: 0 }}>
          <FaceBadge face={mockFace} size={38} radius={11} />
        </div>
      ) : (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'var(--mf-surface-tint)',
            border: '1px dashed var(--mf-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 20 20"
            fill="none"
            stroke="var(--mf-text-muted)"
            strokeWidth={1.6}
            strokeLinecap="round"
          >
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </div>
      )}

      {/* 本文 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 7px',
              borderRadius: 4,
              background: typeMeta.bg,
              color: typeMeta.color,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              flexShrink: 0,
            }}
          >
            {typeMeta.label}
          </div>
          {faceName && (
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--mf-brand)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {faceName}
            </span>
          )}
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: 'var(--mf-text-muted)',
              flexShrink: 0,
            }}
          >
            {relativeTime(notification.createdAt)}
          </span>
        </div>

        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.6,
            color: 'var(--mf-ink)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {preview}
        </div>
      </div>
    </div>
  );
};

type Props = {
  notifications: Notification[];
  faces: Face[];
  seeds: Seed[];
};

const NotificationList = ({ notifications, faces, seeds }: Props) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const t = useTranslations('notificationList');

  const faceMap = useMemo(() => createLookupMap(faces, (face) => face.id), [faces]);
  const seedMap = useMemo(() => createLookupMap(seeds, (seed) => seed.id), [seeds]);

  const FILTER_LABELS: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'sub', label: t('filterSub') },
    { key: 'link', label: t('filterLink') },
  ];

  const filtered = useMemo(
    () =>
      notifications.filter((n) => {
        if (filter === 'sub') return n.type === 'subscribe';
        if (filter === 'link') return n.type === 'link';
        return true;
      }),
    [notifications, filter]
  );

  // 日付でグループ化
  const grouped = useMemo(() => {
    const groups: { dateKey: string; items: Notification[] }[] = [];
    let lastKey = '';
    for (const n of filtered) {
      const dateKey = n.createdAt.slice(0, 10);
      if (dateKey !== lastKey) {
        groups.push({ dateKey, items: [n] });
        lastKey = dateKey;
      } else {
        groups[groups.length - 1].items.push(n);
      }
    }
    return groups;
  }, [filtered]);

  return (
    <div>
      {/* フィルターピル */}
      <div
        style={{
          padding: '14px 18px 10px',
          display: 'flex',
          gap: 6,
          borderBottom: '0.5px solid var(--mf-line-soft)',
        }}
      >
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            style={{
              padding: '5px 11px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 600,
              background: filter === key ? 'var(--mf-brand)' : 'transparent',
              color: filter === key ? '#fff' : 'var(--mf-text-sub)',
              border: filter === key ? 'none' : '1px solid var(--mf-line)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: '80px 0',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--mf-text-muted)' }}>
            {t('noNotificationsFiltered')}
          </p>
        </div>
      ) : (
        grouped.map(({ dateKey, items }) => (
          <div key={dateKey}>
            <DateBar
              label={dateKey >= '2026-03-30' ? t('today') : t('earlier')}
              date={dateKey.replace(/-/g, '/')}
            />
            {items.map((notification) => {
              if (notification.type === 'link') {
                const seed = seedMap.get(notification.seedId);
                const linkedFace = seed ? faceMap.get(seed.faceId) : undefined;
                return (
                  <NotifItem
                    key={notification.id}
                    notification={notification}
                    faceName={linkedFace ? getFaceTitle(linkedFace) : undefined}
                    faceId={linkedFace?.id}
                    faceImageUrl={linkedFace?.image?.url}
                    preview={seed?.body ?? t('linkedPreview')}
                    typeLinkLabel={t('typeLinkLabel')}
                    typeUpdateLabel={t('typeUpdateLabel')}
                  />
                );
              }

              const face = faceMap.get(notification.faceId);
              return (
                <NotifItem
                  key={notification.id}
                  notification={notification}
                  faceName={face ? getFaceTitle(face) : undefined}
                  faceId={face?.id}
                  faceImageUrl={face?.image?.url}
                  preview={
                    face
                      ? t('updatedPreview', { faceName: getFaceTitle(face) })
                      : t('noNotifications')
                  }
                  typeLinkLabel={t('typeLinkLabel')}
                  typeUpdateLabel={t('typeUpdateLabel')}
                />
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationList;
