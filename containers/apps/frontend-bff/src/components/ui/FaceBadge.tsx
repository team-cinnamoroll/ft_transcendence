import { getFaceColor, getFaceKanji, getFaceTitle } from '@/lib/display';
import type { Face } from '@/types/face';

type FaceBadgeProps = {
  face: Face;
  size?: number;
  radius?: number;
};

const FaceBadge = ({ face, size = 36, radius = 10 }: FaceBadgeProps) => {
  const color = getFaceColor(face.id);
  const kanji = getFaceKanji(getFaceTitle(face));

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: face.imageUrl ? undefined : color,
        backgroundImage: face.imageUrl ? `url(${face.imageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
        fontFamily: 'var(--mf-font-serif)',
        fontSize: size * 0.48,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {!face.imageUrl && kanji}
    </div>
  );
};

export default FaceBadge;
