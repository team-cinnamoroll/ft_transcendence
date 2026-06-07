'use client';

import { useState, useMemo } from 'react';
import { type Seed } from '@/types/seed';
import { useTranslations } from 'next-intl';

type SeedTileCalendarProps = {
  activities: Seed[];
};

const REFERENCE_DATE = new Date('2026-04-01');

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 1日の投稿数に応じた 5 段階カラーを返す（MF amber scale） */
const getColorStyle = (count: number): string => {
  if (count === 0) return 'var(--mf-surface-tint)';
  if (count === 1) return 'rgba(212,146,42,0.25)';
  if (count <= 3) return 'rgba(212,146,42,0.50)';
  if (count <= 5) return 'rgba(212,146,42,0.75)';
  return 'var(--mf-accent)';
};

const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isoToDateKey = (iso: string): string => iso.slice(0, 10);

type WeekData = {
  days: Array<{ date: Date; key: string; count: number }>;
  startDate: Date;
  endDate: Date;
};

const LEGEND_COUNTS = [0, 1, 2, 4, 6];

const SeedTileCalendar = ({ activities }: SeedTileCalendarProps) => {
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);
  const t = useTranslations('activityTileCalendar');

  const weeks = useMemo<WeekData[]>(() => {
    const today = new Date(REFERENCE_DATE);
    const dayOfWeek = today.getDay();
    const sundayOfThisWeek = new Date(today);
    sundayOfThisWeek.setDate(today.getDate() - dayOfWeek);

    const startSunday = new Date(sundayOfThisWeek);
    startSunday.setDate(sundayOfThisWeek.getDate() - 51 * 7);

    const countMap: Record<string, number> = {};
    for (const act of activities) {
      const key = isoToDateKey(act.createdAt);
      countMap[key] = (countMap[key] ?? 0) + 1;
    }

    const result: WeekData[] = [];
    for (let w = 0; w < 52; w++) {
      const days: WeekData['days'] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startSunday);
        date.setDate(startSunday.getDate() + w * 7 + d);
        const key = toDateKey(date);
        days.push({ date, key, count: countMap[key] ?? 0 });
      }
      result.push({ days, startDate: days[0].date, endDate: days[6].date });
    }
    return result;
  }, [activities]);

  const monthLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    let lastMonth = -1;
    weeks.forEach((week, idx) => {
      const month = week.startDate.getMonth();
      if (month !== lastMonth) {
        labels[idx] = `${month + 1}月`;
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  const selectedWeekActivities = useMemo<Seed[]>(() => {
    if (selectedWeekIdx === null) return [];
    const week = weeks[selectedWeekIdx];
    const startKey = toDateKey(week.startDate);
    const endKey = toDateKey(week.endDate);
    return [...activities]
      .filter((act) => {
        const key = isoToDateKey(act.createdAt);
        return key >= startKey && key <= endKey;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [selectedWeekIdx, weeks, activities]);

  const handleWeekClick = (wIdx: number) => {
    setSelectedWeekIdx((prev) => (prev === wIdx ? null : wIdx));
  };

  return (
    <section>
      <h2
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: 'var(--mf-text-muted)',
          marginBottom: 10,
        }}
      >
        {t('title')}
      </h2>

      {/* カレンダー本体（横スクロール） */}
      <div
        className="overflow-x-auto mf-scroll"
        style={{
          borderRadius: 12,
          background: 'var(--mf-bg-paper)',
          border: '0.5px solid var(--mf-line)',
          padding: '10px 12px 12px',
        }}
      >
        {/* 月ラベル行 */}
        <div className="flex gap-[2px] mb-1 pl-[26px]">
          {weeks.map((_, wIdx) => (
            <div key={wIdx} style={{ flexShrink: 0, width: 13 }}>
              {monthLabels[wIdx] && (
                <span style={{ fontSize: 9, lineHeight: 1, color: 'var(--mf-text-muted)' }}>
                  {monthLabels[wIdx]}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 曜日ラベル + セルグリッド */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          {/* 曜日ラベル */}
          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, gap: 2 }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{ width: 18, height: 11, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
              >
                {(i === 1 || i === 3 || i === 5) && (
                  <span style={{ fontSize: 9, lineHeight: 1, color: 'var(--mf-text-muted)' }}>
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 週 × 日 のセル群 */}
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wIdx) => {
              const isSelected = selectedWeekIdx === wIdx;
              return (
                <button
                  key={wIdx}
                  type="button"
                  aria-label={t('weekAriaLabel', { date: toDateKey(week.startDate) })}
                  onClick={() => handleWeekClick(wIdx)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    gap: 2,
                    width: 11,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  {week.days.map((day) => (
                    <div
                      key={day.key}
                      title={`${day.key}: ${t('dayCount', { count: day.count })}`}
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 2,
                        background: getColorStyle(day.count),
                        boxShadow: isSelected
                          ? '0 0 0 1px var(--mf-accent), 0 0 0 2px var(--mf-bg-paper)'
                          : 'none',
                      }}
                    />
                  ))}
                </button>
              );
            })}
          </div>
        </div>

        {/* 凡例 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 8 }}>
          <span style={{ fontSize: 9, color: 'var(--mf-text-muted)', marginRight: 2 }}>{t('few')}</span>
          {LEGEND_COUNTS.map((count, i) => (
            <div
              key={i}
              style={{ width: 11, height: 11, borderRadius: 2, background: getColorStyle(count) }}
            />
          ))}
          <span style={{ fontSize: 9, color: 'var(--mf-text-muted)', marginLeft: 2 }}>{t('many')}</span>
        </div>
      </div>

      {/* 選択週のアクティビティ一覧 */}
      {selectedWeekIdx !== null && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 11.5, color: 'var(--mf-text-muted)', marginBottom: 8 }}>
            {toDateKey(weeks[selectedWeekIdx].startDate).replace(/-/g, '/')}
            {' 〜 '}
            {toDateKey(weeks[selectedWeekIdx].endDate).replace(/-/g, '/')}
            {t('weekRecord')}
          </p>
          {selectedWeekActivities.length === 0 ? (
            <p
              style={{
                borderRadius: 12,
                padding: '14px',
                textAlign: 'center',
                fontSize: 13,
                color: 'var(--mf-text-muted)',
                background: 'var(--mf-bg-paper)',
                border: '0.5px solid var(--mf-line)',
              }}
            >
              {t('noRecord')}
            </p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', padding: 0, margin: 0 }}>
              {selectedWeekActivities.map((act) => (
                <li
                  key={act.id}
                  style={{
                    borderRadius: 10,
                    background: 'var(--mf-surface-card)',
                    border: '0.5px solid var(--mf-line)',
                    padding: '10px 12px',
                    fontSize: 13,
                  }}
                >
                  <p style={{ fontSize: 11, color: 'var(--mf-text-muted)', marginBottom: 4 }}>
                    {isoToDateKey(act.createdAt).replace(/-/g, '/')}
                  </p>
                  <p
                    style={{
                      lineHeight: 1.6,
                      color: 'var(--mf-ink)',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      margin: 0,
                    }}
                  >
                    {act.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default SeedTileCalendar;
