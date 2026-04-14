import { cn } from "@/lib/utils";

type FaceChipProps = {
  title: string;
  faceId: string;
  className?: string;
};

/**
 * フェイス ID の末尾数字をインデックスとしてカラーパレットから色を決定する。
 * 固定の色パレットを使うのでフェイスごとに一貫した色が付く。
 */
const COLOR_PALETTE = [
  "bg-violet-900/60 text-violet-300",
  "bg-sky-900/60 text-sky-300",
  "bg-emerald-900/60 text-emerald-300",
  "bg-amber-900/60 text-amber-300",
  "bg-rose-900/60 text-rose-300",
  "bg-pink-900/60 text-pink-300",
  "bg-teal-900/60 text-teal-300",
  "bg-orange-900/60 text-orange-300",
];

const getColorClass = (faceId: string): string => {
  // id 末尾の数字全部を合算して index を決める
  const digits = faceId.replace(/\D/g, "");
  const sum = digits.split("").reduce((acc, d) => acc + parseInt(d, 10), 0);
  return COLOR_PALETTE[sum % COLOR_PALETTE.length];
};

const FaceChip = ({ title, faceId, className }: FaceChipProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getColorClass(faceId),
        className,
      )}
    >
      {title}
    </span>
  );
};

export default FaceChip;
