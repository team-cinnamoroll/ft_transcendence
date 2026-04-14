"use client";

import { useState, useMemo } from "react";
import { type Activity } from "@/types/activity";
import { cn } from "@/lib/utils";

type ActivityTileCalendarProps = {
  activities: Activity[];
};

// カレンダーの基準日（モックデータの「現在」 = 2026/04/01）
const REFERENCE_DATE = new Date("2026-04-01");

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 1日の投稿数に応じた 5 段階カラークラスを返す */
const getColorClass = (count: number): string => {
  if (count === 0) return "bg-zinc-800";
  if (count === 1) return "bg-green-200";
  if (count <= 3) return "bg-green-400";
  if (count <= 5) return "bg-green-500";
  return "bg-green-700";
};

/** Date を "yyyy-MM-dd" キーへ変換 */
const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** ISO 8601 文字列の先頭 10 文字（yyyy-MM-dd）を取得 */
const isoToDateKey = (iso: string): string => iso.slice(0, 10);

type WeekData = {
  days: Array<{ date: Date; key: string; count: number }>;
  startDate: Date;
  endDate: Date;
};

const ActivityTileCalendar = ({ activities }: ActivityTileCalendarProps) => {
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);

  // 52 週分のデータを構築
  const weeks = useMemo<WeekData[]>(() => {
    const today = new Date(REFERENCE_DATE);
    const dayOfWeek = today.getDay(); // 0=日曜
    const sundayOfThisWeek = new Date(today);
    sundayOfThisWeek.setDate(today.getDate() - dayOfWeek);

    // 52 週前の日曜日をカレンダー開始日とする
    const startSunday = new Date(sundayOfThisWeek);
    startSunday.setDate(sundayOfThisWeek.getDate() - 51 * 7);

    // 日ごとのアクティビティ件数マップを作成
    const countMap: Record<string, number> = {};
    for (const act of activities) {
      const key = isoToDateKey(act.createdAt);
      countMap[key] = (countMap[key] ?? 0) + 1;
    }

    const result: WeekData[] = [];
    for (let w = 0; w < 52; w++) {
      const days: WeekData["days"] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startSunday);
        date.setDate(startSunday.getDate() + w * 7 + d);
        const key = toDateKey(date);
        days.push({ date, key, count: countMap[key] ?? 0 });
      }
      result.push({
        days,
        startDate: days[0].date,
        endDate: days[6].date,
      });
    }
    return result;
  }, [activities]);

  // 月ラベルの位置（週の開始日が月初めなら表示）
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

  // 選択週のアクティビティを降順で取得
  const selectedWeekActivities = useMemo<Activity[]>(() => {
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
    <section className="px-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        振り返り
      </h2>

      {/* カレンダー本体（横スクロール） */}
      <div className="overflow-x-auto rounded-xl bg-zinc-800/40 p-3 pb-4">
        {/* 月ラベル行 */}
        <div className="flex gap-[2px] mb-1 pl-[26px]">
          {weeks.map((_, wIdx) => (
            <div
              key={wIdx}
              className="flex-shrink-0 w-[13px]"
            >
              {monthLabels[wIdx] && (
                <span className="text-[9px] leading-none text-zinc-500">
                  {monthLabels[wIdx]}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 曜日ラベル + セルグリッド */}
        <div className="flex items-start gap-[6px]">
          {/* 曜日ラベル（月・水・金 のみ表示） */}
          <div className="flex flex-col flex-shrink-0 gap-[2px]">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="w-[18px] h-[11px] flex items-center justify-end"
              >
                {(i === 1 || i === 3 || i === 5) && (
                  <span className="text-[9px] leading-none text-zinc-500">
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 週 × 日 のセル群 */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wIdx) => {
              const isSelected = selectedWeekIdx === wIdx;
              return (
                <button
                  key={wIdx}
                  type="button"
                  aria-label={`${toDateKey(week.startDate)} の週`}
                  onClick={() => handleWeekClick(wIdx)}
                  className="flex flex-col flex-shrink-0 gap-[2px] w-[11px] focus:outline-none"
                >
                  {week.days.map((day) => (
                    <div
                      key={day.key}
                      title={`${day.key}: ${day.count}件`}
                      className={cn(
                        "w-[11px] h-[11px] rounded-sm transition-all",
                        getColorClass(day.count),
                        isSelected
                          ? "ring-1 ring-violet-400 ring-offset-1 ring-offset-zinc-900"
                          : "hover:brightness-110",
                      )}
                    />
                  ))}
                </button>
              );
            })}
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex items-center justify-end gap-[3px] mt-2.5">
          <span className="text-[9px] text-zinc-500 mr-1">少</span>
          {(["bg-zinc-800", "bg-green-200", "bg-green-400", "bg-green-500", "bg-green-700"] as const).map(
            (cls, i) => (
              <div
                key={i}
                className={cn("w-[11px] h-[11px] rounded-sm", cls)}
              />
            ),
          )}
          <span className="text-[9px] text-zinc-500 ml-1">多</span>
        </div>
      </div>

      {/* 選択週のアクティビティ一覧 */}
      {selectedWeekIdx !== null && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-zinc-500">
            {toDateKey(weeks[selectedWeekIdx].startDate).replace(/-/g, "/")}{" "}
            〜{" "}
            {toDateKey(weeks[selectedWeekIdx].endDate).replace(/-/g, "/")}
            の記録
          </p>
          {selectedWeekActivities.length === 0 ? (
            <p className="rounded-xl bg-zinc-800/40 p-4 text-center text-sm text-zinc-500">
              この週には記録がありません
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedWeekActivities.map((act) => (
                <li
                  key={act.id}
                  className="rounded-xl bg-zinc-800/60 p-3 text-sm"
                >
                  <p className="mb-1 text-xs text-zinc-500">
                    {isoToDateKey(act.createdAt).replace(/-/g, "/")}
                  </p>
                  <p className="line-clamp-3 leading-relaxed text-zinc-200">
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

export default ActivityTileCalendar;
