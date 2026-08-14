'use client';

import { useState, useMemo } from 'react';
import { type Seed } from '@/types/seed';
import { useTranslations, useFormatter } from 'next-intl';

type SeedTileCalendarProps = {
  seeds: Seed[];
  /** サーバー側で算出した基準日。クライアント側で `new Date()` を呼ぶとSSRとの間でhydration mismatchが起きるため、必ず親から受け取る */
  today: Date;
};

const getColorStyle = (count: number): string => {
  if (count === 0) return 'var(--mf-surface-tint)';
  if (count === 1) return 'rgba(212,146,42,0.25)';
  if (count <= 3) return 'rgba(212,146,42,0.50)';
  if (count <= 5) return 'rgba(212,146,42,0.75)';
  return 'var(--mf-accent)';
};

const toDateKey = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isoToDateKey = (iso: string): string => iso.slice(0, 10);

type WeekData = {
  days: Array<{ date: Date; key: string; count: number }>;
  startDate: Date;
  endDate: Date;
};

const LEGEND_COUNTS = [0, 1, 2, 4, 6];

const SeedTileCalendar = ({ seeds, today }: SeedTileCalendarProps) => {
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);
  const t = useTranslations('seedTileCalendar');
  const format = useFormatter();

  const weeks = useMemo<WeekData[]>(() => {
    // タイムゾーンによるサーバー(UTC等)とクライアント(JST等)でのgetDay()のズレを防ぐため、
    // まず指定したタイムゾーン(Asia/Tokyo)での「年月日」を抽出し、それをUTCとして扱うDateを作成する。
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(today);
    const y = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
    const m = parseInt(parts.find((p) => p.type === 'month')!.value, 10) - 1;
    const d = parseInt(parts.find((p) => p.type === 'day')!.value, 10);

    // これで「日本の現在日付の0時0分」を表す絶対的なUTC timestampが得られる
    // サーバーでもクライアントでも、このDateに対して getUTCDay() 等を呼べば必ず一致する
    const midnightUTC = new Date(Date.UTC(y, m, d));

    const dayOfWeek = midnightUTC.getUTCDay();
    const sundayOfThisWeek = new Date(midnightUTC);
    sundayOfThisWeek.setUTCDate(midnightUTC.getUTCDate() - dayOfWeek);

    const startSunday = new Date(sundayOfThisWeek);
    startSunday.setUTCDate(sundayOfThisWeek.getUTCDate() - 51 * 7);

    const countMap: Record<string, number> = {};
    for (const seed of seeds) {
      const key = isoToDateKey(seed.createdAt);
      countMap[key] = (countMap[key] ?? 0) + 1;
    }

    const result: WeekData[] = [];
    for (let w = 0; w < 52; w++) {
      const days: WeekData['days'] = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(startSunday);
        date.setUTCDate(startSunday.getUTCDate() + w * 7 + dayOffset);
        const key = toDateKey(date);
        days.push({ date, key, count: countMap[key] ?? 0 });
      }
      result.push({ days, startDate: days[0].date, endDate: days[6].date });
    }
    return result;
  }, [seeds, today]);

  const monthLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    let lastMonth = -1;
    weeks.forEach((week, idx) => {
      const month = week.startDate.getUTCMonth();
      if (month !== lastMonth) {
        labels[idx] = format.dateTime(week.startDate, { month: 'short' });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks, format]);

  const weekdayLabels = useMemo(() => {
    if (weeks.length === 0) return [];
    return weeks[0].days.map((d) => format.dateTime(d.date, { weekday: 'short' }));
  }, [weeks, format]);

  const selectedWeekSeeds = useMemo<Seed[]>(() => {
    if (selectedWeekIdx === null) return [];
    const week = weeks[selectedWeekIdx];
    const startKey = toDateKey(week.startDate);
    const endKey = toDateKey(week.endDate);
    return [...seeds]
      .filter((s) => {
        const key = isoToDateKey(s.createdAt);
        return key >= startKey && key <= endKey;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [selectedWeekIdx, weeks, seeds]);

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

      <div
        className="overflow-x-auto mf-scroll"
        style={{
          borderRadius: 12,
          background: 'var(--mf-bg-paper)',
          border: '0.5px solid var(--mf-line)',
          padding: '10px 12px 12px',
        }}
      >
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

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, gap: 2 }}>
            {weekdayLabels.map((label, i) => (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                {(i === 1 || i === 3 || i === 5) && (
                  <span style={{ fontSize: 9, lineHeight: 1, color: 'var(--mf-text-muted)' }}>
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>

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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 3,
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 9, color: 'var(--mf-text-muted)', marginRight: 2 }}>
            {t('few')}
          </span>
          {LEGEND_COUNTS.map((count, i) => (
            <div
              key={i}
              style={{ width: 11, height: 11, borderRadius: 2, background: getColorStyle(count) }}
            />
          ))}
          <span style={{ fontSize: 9, color: 'var(--mf-text-muted)', marginLeft: 2 }}>
            {t('many')}
          </span>
        </div>
      </div>

      {selectedWeekIdx !== null && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 11.5, color: 'var(--mf-text-muted)', marginBottom: 8 }}>
            {t('weekRecord', {
              range: format.dateTimeRange(
                weeks[selectedWeekIdx].startDate,
                weeks[selectedWeekIdx].endDate,
                { month: 'short', day: 'numeric' }
              ),
            })}
          </p>
          {selectedWeekSeeds.length === 0 ? (
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
            <ul
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {selectedWeekSeeds.map((seed) => (
                <li
                  key={seed.id}
                  style={{
                    borderRadius: 10,
                    background: 'var(--mf-surface-card)',
                    border: '0.5px solid var(--mf-line)',
                    padding: '10px 12px',
                    fontSize: 13,
                  }}
                >
                  <p style={{ fontSize: 11, color: 'var(--mf-text-muted)', marginBottom: 4 }}>
                    {isoToDateKey(seed.createdAt).replace(/-/g, '/')}
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
                    {seed.body}
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
