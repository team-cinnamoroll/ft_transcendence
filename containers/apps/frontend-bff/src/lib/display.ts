import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';

const DEFAULT_AVATAR_URL = '/images/default-avatar.png';
const DEFAULT_FACE_IMAGE_URL = '/images/default-face.png';

/** avatarUrl が未設定の場合にデフォルト画像へフォールバックする */
export const getAvatarUrl = (user: Pick<UserProfile, 'avatar'>): string => {
  return user.avatar?.url || DEFAULT_AVATAR_URL;
};

/** Faceの画像が未設定の場合にデフォルト画像へフォールバックする */
export const getFaceImageUrl = (face: Pick<Face, 'image'>): string => {
  return face.image?.url || DEFAULT_FACE_IMAGE_URL;
};

/** mimeTypeが画像かどうかを判定する。Seedの添付ファイル(PDF等)の表示切り替えに使う */
export const isImageFile = (mimeType: string): boolean => mimeType.startsWith('image/');

export const createLookupMap = <K extends PropertyKey, T>(
  items: T[],
  getKey: (item: T) => K
): Map<K, T> => {
  return new Map(items.map((item) => [getKey(item), item] as const));
};

export const getFaceTitle = (face: Pick<Face, 'name' | 'emoji'>): string => {
  return [face.emoji, face.name]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')
    .trim();
};

/** Midnight Ink の 6 フェイスカラー */
const MF_FACE_COLORS = [
  '#5b8db8', // water    水青
  '#5b9b72', // moss     苔緑
  '#7b6b9e', // wisteria 藤紫
  '#c47a50', // persimmon 柿橙
  '#b06b7a', // rose     薔薇
  '#a89050', // grass    枯草
];

/** faceId の数字和 mod 6 でカラーを決定 */
export const getFaceColor = (faceId: string): string => {
  const digits = faceId.replace(/\D/g, '');
  if (!digits) return MF_FACE_COLORS[0];
  const sum = digits.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  return MF_FACE_COLORS[sum % MF_FACE_COLORS.length];
};
