import Image from 'next/image';
import { getFaceImageUrl, getFaceTitle } from '@/lib/display';
import type { Face } from '@/types/face';

type FaceBadgeProps = {
  face: Face;
  size?: number;
  radius?: number;
};

const FaceBadge = ({ face, size = 36, radius = 10 }: FaceBadgeProps) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <Image
        src={getFaceImageUrl(face)}
        alt={getFaceTitle(face)}
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
};

export default FaceBadge;
