type BadgeProps = {
  emoji: string;
  className?: string;
};

const Badge = ({ emoji, className }: BadgeProps) => {
  return (
    <span
      aria-label="バッジ"
      className={className}
    >
      {emoji}
    </span>
  );
};

export default Badge;
