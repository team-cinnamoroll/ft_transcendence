import type { Face } from "@/types/face";

export const createLookupMap = <K extends PropertyKey, T>(
  items: T[],
  getKey: (item: T) => K,
): Map<K, T> => {
  return new Map(items.map((item) => [getKey(item), item] as const));
};

export const getFaceTitle = (
  face: Pick<Face, "name" | "emoji">,
): string => {
  return [face.emoji, face.name]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .trim();
};