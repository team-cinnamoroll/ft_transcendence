type DateBarProps = {
  label: string;
  date: string;
};

const DateBar = ({ label, date }: DateBarProps) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 18px 4px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--mf-font-sans)',
          fontSize: 11.5,
          color: 'var(--mf-brand)',
          letterSpacing: 0.5,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 0.5,
          background: 'var(--mf-line)',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--mf-font-sans)',
          fontSize: 10.5,
          color: 'var(--mf-text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        {date}
      </span>
    </div>
  );
};

export default DateBar;
