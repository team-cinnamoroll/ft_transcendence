/**
 * @/server/actions/faces のモック。
 * Storybook 環境では 'use server' / next/cache が使えないため、
 * createFaceAction だけを偽実装で置き換える。
 */
import type { Face } from '../../src/types/face';

type CreateFaceInput = {
  name: string;
  emoji?: string;
  description?: string;
  isPrivate: boolean;
};

export async function createFaceAction(input: CreateFaceInput): Promise<Face> {
  return {
    id: `face-mock-${Date.now()}`,
    userId: 'user-1',
    name: input.name,
    emoji: input.emoji,
    description: input.description,
    isPrivate: input.isPrivate,
    imageUrl: undefined,
  };
}
