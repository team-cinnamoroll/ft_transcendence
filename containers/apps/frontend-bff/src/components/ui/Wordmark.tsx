type WordmarkProps = {
  size?: number;
  color?: string;
  withDot?: boolean;
};

const Wordmark = ({ size = 19, color, withDot = true }: WordmarkProps) => {
  return (
    <div
      style={{
        fontFamily: 'var(--mf-font-serif-en)',
        fontSize: size,
        fontWeight: 500,
        letterSpacing: -0.2,
        color: color ?? 'var(--mf-brand)',
        lineHeight: 1,
        fontStyle: 'italic',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <span>Multi</span>
      <span style={{ fontStyle: 'normal', fontWeight: 600 }}>Face</span>
      {withDot && (
        <span
          style={{
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: '50%',
            background: 'var(--mf-accent)',
            marginLeft: 4,
            alignSelf: 'center',
          }}
        />
      )}
    </div>
  );
};

export default Wordmark;
