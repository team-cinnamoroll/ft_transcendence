import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  src: string;
  alt: string;
  size?: AvatarSize;
  className?: string;
};

const sizeMap: Record<AvatarSize, { px: number; className: string }> = {
  sm: { px: 24, className: "w-6 h-6" },
  md: { px: 40, className: "w-10 h-10" },
  lg: { px: 64, className: "w-16 h-16" },
};

const Avatar = ({ src, alt, size = "md", className }: AvatarProps) => {
  const { px, className: sizeClass } = sizeMap[size];

  return (
    <Image
      src={src}
      alt={alt}
      width={px}
      height={px}
      className={cn(
        "rounded-full object-cover ring-1 ring-zinc-700",
        sizeClass,
        className,
      )}
    />
  );
};

export default Avatar;
