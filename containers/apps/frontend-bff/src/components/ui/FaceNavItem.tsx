'use client';

import FaceBadge from '@/components/ui/FaceBadge';
import type { Face } from '@/types/face';

type Props = {
  face: Face;
  activeFaceId?: string;
  seedCount?: number;
  onClick?: (face: Face) => void;
};

const FaceNavItem = ({ face, activeFaceId, seedCount, onClick }: Props) => {
  const isActive = activeFaceId === face.id;

  return (
    <li>
      <button
        type="button"
        onClick={() => onClick?.(face)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '7px 14px',
          borderRadius: 8,
          background: isActive ? 'rgba(30,42,74,0.07)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        <FaceBadge face={face} size={34} radius={9} />
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--mf-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {face.name}
        </span>
        {face.isPrivate && (
          <svg
            width={11}
            height={11}
            viewBox="0 0 14 14"
            fill="none"
            stroke="var(--mf-text-muted)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x={2.5} y={6} width={9} height={6.5} rx={1.2} />
            <path d="M4.5 6V4a2.5 2.5 0 015 0v2" />
          </svg>
        )}
        {seedCount !== undefined && (
          <span
            style={{ fontSize: 11, color: 'var(--mf-text-muted)', fontWeight: 600, flexShrink: 0 }}
          >
            {seedCount}
          </span>
        )}
      </button>
    </li>
  );
};

export default FaceNavItem;
