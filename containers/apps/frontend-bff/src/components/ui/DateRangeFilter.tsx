'use client';

type Props = {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  fromLabel?: string;
  toLabel?: string;
};

const dateInputStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: 'var(--mf-text)',
  background: 'var(--mf-surface)',
  border: '0.5px solid var(--mf-line)',
  borderRadius: 8,
  padding: '5px 8px',
  fontFamily: 'var(--mf-font-sans)',
};

/** 期間(開始日・終了日)を指定するフィルタUI。実際の絞り込み処理は呼び出し側が行う */
const DateRangeFilter = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  fromLabel,
  toLabel,
}: Props) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => onFromDateChange(e.target.value)}
        aria-label={fromLabel}
        style={dateInputStyle}
      />
      <span style={{ fontSize: 12, color: 'var(--mf-text-muted)' }}>〜</span>
      <input
        type="date"
        value={toDate}
        onChange={(e) => onToDateChange(e.target.value)}
        aria-label={toLabel}
        style={dateInputStyle}
      />
    </div>
  );
};

export default DateRangeFilter;
