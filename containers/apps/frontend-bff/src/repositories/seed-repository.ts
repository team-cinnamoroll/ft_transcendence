import 'server-only';

import type { Seed, CreateSeedRequest } from '@/types/seed';
import { seeds } from '@/mocks/seeds';
import { createSingletonProvider } from '@/repositories/provider';

export type CreateSeedInput = CreateSeedRequest;

const sortByCreatedAtDesc = (list: Seed[]): Seed[] =>
  [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export type SeedRepositorySpec = {
  findById: (seedId: string) => Promise<Seed | null>;
  listAll: () => Promise<Seed[]>;
  listByFaceId: (faceId: string) => Promise<Seed[]>;
  listByUserId: (userId: string) => Promise<Seed[]>;
  listByFaceIds: (faceIds: string[]) => Promise<Seed[]>;
  create: (userId: string, input: CreateSeedInput) => Promise<Seed>;
};

export function createSeedMockRepositoryImpl(): SeedRepositorySpec {
  return {
    findById: async (seedId) => seeds.find((s) => s.id === seedId) ?? null,
    listAll: async () => sortByCreatedAtDesc(seeds),
    listByFaceId: async (faceId) => sortByCreatedAtDesc(seeds.filter((s) => s.faceId === faceId)),
    listByUserId: async (userId) => sortByCreatedAtDesc(seeds.filter((s) => s.userId === userId)),
    listByFaceIds: async (faceIds) =>
      sortByCreatedAtDesc(seeds.filter((s) => faceIds.includes(s.faceId))),
    create: async (userId, input) => {
      const newSeed: Seed = {
        id: `seed-mock-${Date.now()}`,
        userId,
        ...input,
        createdAt: new Date().toISOString(),
      };
      return newSeed;
    },
  };
}

export const seedMockRepositoryImpl: SeedRepositorySpec = createSeedMockRepositoryImpl();

export const getSeedRepository = createSingletonProvider<SeedRepositorySpec>(
  () => seedMockRepositoryImpl
);
