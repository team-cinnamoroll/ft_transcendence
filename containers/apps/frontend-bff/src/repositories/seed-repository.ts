import 'server-only';

import type { Seed } from '@/types/seed';
import { seeds as activities } from '@/mocks/seeds';
import { createSingletonProvider } from '@/repositories/provider';

export type SeedRepositorySpec = {
  findById: (seedId: string) => Promise<Seed | null>;
  listAll: () => Promise<Seed[]>;
  listByFaceId: (faceId: string) => Promise<Seed[]>;
};

export function createSeedMockRepositoryImpl(): SeedRepositorySpec {
  return {
    findById: async (seedId) => activities.find((a) => a.id === seedId) ?? null,
    listAll: async () => activities,
    listByFaceId: async (faceId) => activities.filter((a) => a.faceId === faceId),
  };
}

export const seedMockRepositoryImpl: SeedRepositorySpec = createSeedMockRepositoryImpl();

export const getSeedRepository = createSingletonProvider<SeedRepositorySpec>(
  () => seedMockRepositoryImpl
);
