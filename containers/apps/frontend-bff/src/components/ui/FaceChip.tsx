import { getFaceColor } from '@/lib/display';
import { cn } from '@/lib/utils';

type FaceChipProps = {
  title: string;
  faceId: string;
  size?: 'sm' | 'md';
  className?: string;
};

const FaceChip = ({
  title,
  faceId,
  size = 'sm',
  className,
}: FaceChipProps) => {
  const color = getFaceColor(faceId);
  const dotSize = size === 'sm' ? 5 : 6;
  const fontSize = size === 'sm' ? 11 : 12;
  const padding = size === 'sm' ? '2px 8px 2px 7px' : '3px 10px 3px 9px';

  return (
    <span
      className={cn('inline-flex items-center whitespace-nowrap', className)}
      style={{
        gap: 5,
        padding,
        background: `${color}20`,
        borderRadius: 999,
        fontFamily: 'var(--mf-font-sans)',
        fontSize,
        fontWeight: 600,
        color,
        letterSpacing: 0.1,
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {title}
    </span>
  );
};

export default FaceChip;
