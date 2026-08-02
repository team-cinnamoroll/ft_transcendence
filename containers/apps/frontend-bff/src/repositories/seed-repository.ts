import 'server-only';

import type { Seed, CreateSeedRequest, UpdateSeedRequest } from '@/types/seed';
import { seeds } from '@/mocks/seeds';
import { createSingletonProvider } from '@/repositories/provider';

export type CreateSeedInput = CreateSeedRequest;
export type UpdateSeedInput = UpdateSeedRequest;

const sortByCreatedAtDesc = (list: Seed[]): Seed[] =>
  [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export type SeedRepositorySpec = {
  findById: (seedId: string) => Promise<Seed | null>;
  listAll: () => Promise<Seed[]>;
  listByFaceId: (faceId: string) => Promise<Seed[]>;
  listByUserId: (userId: string) => Promise<Seed[]>;
  listByFaceIds: (faceIds: string[]) => Promise<Seed[]>;
  create: (userId: string, input: CreateSeedInput) => Promise<Seed>;
  update: (seedId: string, userId: string, input: UpdateSeedInput) => Promise<Seed>;
  delete: (seedId: string, userId: string) => Promise<void>;
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
      const createdAt = new Date().toISOString();
      const newSeed: Seed = {
        id: `seed-mock-${Date.now()}`,
        userId,
        ...input,
        images:
          input.imageIds.length > 0
            ? input.imageIds.map((imageId) => ({
                id: imageId,
                url: 'https://example.com/mock-image.jpg', // ダミーの画像URL
              }))
            : [],
        createdAt: createdAt,
        updatedAt: createdAt,
      };
      seeds.push(newSeed);
      return newSeed;
    },
    update: async (seedId, userId, input) => {
      const existing = seeds.find((s) => s.id === seedId && s.userId === userId);
      if (!existing) throw new Error('Seed not found');
      const updatedAt = new Date().toISOString();
      const updated: Seed = {
        ...existing,
        body: input.body,
        updatedAt: updatedAt,
        images:
          input.imageIds.length > 0
            ? input.imageIds.map((imageId) => ({
                id: imageId,
                url: 'https://example.com/mock-image.jpg', // ダミーの画像URL
              }))
            : [],
      };

      Object.assign(existing, updated);
      return existing;
    },
    delete: async (seedId, userId) => {
      const index = seeds.findIndex((s) => s.id === seedId && s.userId === userId);
      if (index === -1) throw new Error('Seed not found');
      seeds.splice(index, 1);
    },
  };
}

export const seedMockRepositoryImpl: SeedRepositorySpec = createSeedMockRepositoryImpl();

export const getSeedRepository = createSingletonProvider<SeedRepositorySpec>(
  () => seedMockRepositoryImpl
);
