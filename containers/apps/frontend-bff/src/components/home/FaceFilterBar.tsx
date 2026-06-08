'use client';

import { type Face } from '@/types/face';
import { useTranslations } from 'next-intl';
import FaceBadge from '@/components/ui/FaceBadge';

type FaceFilterBarProps = {
  faces: Face[];
  selectedFaceId: string | null;
  onSelect: (faceId: string | null) => void;
};

const FaceFilterBar = ({ faces, selectedFaceId, onSelect }: FaceFilterBarProps) => {
  const t = useTranslations('faceFilterBar');

  const handleSelectFace = (faceId: string) => {
    onSelect(selectedFaceId === faceId ? null : faceId);
  };

  return (
    <div
      className="overflow-x-auto mf-scroll"
      style={{ borderBottom: '0.5px solid var(--mf-line)', padding: '12px 16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 'max-content' }}>
        {/* すべてボタン */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: selectedFaceId === null ? 'var(--mf-brand)' : 'var(--mf-surface-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'background 0.15s',
            }}
          >
            🌐
          </span>
          <span
            style={{
              fontSize: 10,
              lineHeight: 1,
              maxWidth: 44,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: selectedFaceId === null ? 'var(--mf-brand)' : 'var(--mf-text-muted)',
              fontWeight: selectedFaceId === null ? 700 : 500,
            }}
          >
            {t('all')}
          </span>
        </button>

        {/* 各フェイスボタン */}
        {faces.map((face) => {
          const isActive = selectedFaceId === face.id;
          return (
            <button
              key={face.id}
              type="button"
              onClick={() => handleSelectFace(face.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div
                style={{
                  borderRadius: 11,
                  boxShadow: isActive ? '0 0 0 2.5px var(--mf-accent)' : 'none',
                  transition: 'box-shadow 0.15s',
                }}
              >
                <FaceBadge face={face} size={40} radius={11} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  lineHeight: 1,
                  maxWidth: 44,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: isActive ? 'var(--mf-brand)' : 'var(--mf-text-muted)',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {face.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FaceFilterBar;
