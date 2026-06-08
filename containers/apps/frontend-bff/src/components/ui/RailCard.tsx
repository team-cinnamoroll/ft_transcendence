import type { ReactNode } from 'react';

type RailCardProps = {
  title?: string;
  action?: ReactNode;
  pad?: string;
  children: ReactNode;
};

const RailCard = ({ title, action, pad = '16px', children }: RailCardProps) => {
  return (
    <div
      style={{
        background: 'var(--mf-surface)',
        border: '0.5px solid var(--mf-line)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {title && (
        <div
          style={{
            padding: '14px 16px 10px',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--mf-brand)',
              letterSpacing: 0.2,
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          {action && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--mf-text-muted)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {action}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: title ? `0 ${pad} ${pad}` : pad }}>{children}</div>
    </div>
  );
};

export default RailCard;
