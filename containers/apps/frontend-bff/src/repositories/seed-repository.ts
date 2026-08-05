import 'server-only';

import type {
  Seed,
  CreateSeedRequest,
  UpdateSeedRequest,
  SeedList,
  SeedCreate,
  SeedUpdate,
  SeedSingleId,
} from '@/types/seed';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';

export type CreateSeedInput = CreateSeedRequest;
export type UpdateSeedInput = UpdateSeedRequest;

const sortByCreatedAtDesc = (list: Seed[]): Seed[] =>
  [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export type SeedRepositorySpec = {
  findById: (accessToken: string, seedId: string) => Promise<Seed | null>;
  listAll: (accessToken: string) => Promise<Seed[]>;
  listByFaceId: (accessToken: string, faceId: string) => Promise<Seed[]>;
  listByUserId: (accessToken: string, userId: string) => Promise<Seed[]>;
  listByFaceIds: (accessToken: string, faceIds: string[]) => Promise<Seed[]>;
  create: (accessToken: string, userId: string, input: CreateSeedInput) => Promise<Seed>;
  update: (
    accessToken: string,
    seedId: string,
    userId: string,
    input: UpdateSeedInput
  ) => Promise<Seed>;
  delete: (accessToken: string, seedId: string, userId: string) => Promise<void>;
};

// ─── バックエンドAPI実装 ────────────────────────────────────────

/**
 * GET /seeds をカーソルで全ページ辿って集める。
 * listAll/listByFaceId/listByUserId/listByFaceIds のように一覧全体が必要な場合に使う。
 * 単一IDでの取得(findById)は GET /seeds/:seedId を1回呼ぶだけで完結する(#320)。
 */
async function fetchAllSeeds(
  accessToken: string,
  query: { faceId?: string; userId?: string } = {}
): Promise<Seed[]> {
  const all: Seed[] = [];
  let cursor: string | undefined;

  for (;;) {
    const res = await createBackendClient(accessToken).api.v1.seeds.$get({
      query: {
        ...(query.faceId ? { faceId: query.faceId } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
        limit: '100',
        ...(cursor ? { cursor } : {}),
      },
    });
    if (!res.ok) {
      console.error('SeedRepository: backend request failed', res.status);
      break;
    }
    const json = (await res.json()) as SeedList;
    if (!json.success) {
      break;
    }
    all.push(...json.data.seeds.seeds);
    if (!json.data.seeds.nextCursor) {
      break;
    }
    cursor = json.data.seeds.nextCursor;
  }

  return all;
}

export function createSeedApiRepositoryImpl(): SeedRepositorySpec {
  return {
    findById: async (accessToken, seedId) => {
      const res = await createBackendClient(accessToken).api.v1.seeds[':seedId'].$get({
        param: { seedId },
      });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        console.error('SeedRepository: backend request failed', res.status);
        return null;
      }
      const json = (await res.json()) as SeedSingleId;
      if (!json.success) {
        return null;
      }
      return json.data.seed;
    },

    listAll: async (accessToken) => {
      return sortByCreatedAtDesc(await fetchAllSeeds(accessToken));
    },

    listByFaceId: async (accessToken, faceId) => {
      return sortByCreatedAtDesc(await fetchAllSeeds(accessToken, { faceId }));
    },

    listByUserId: async (accessToken, userId) => {
      return sortByCreatedAtDesc(await fetchAllSeeds(accessToken, { userId }));
    },

    listByFaceIds: async (accessToken, faceIds) => {
      // backendのGET /seedsはfaceIdを1件しか指定できないため、faceIdごとに個別取得して結合する
      const results = await Promise.all(
        faceIds.map((faceId) => fetchAllSeeds(accessToken, { faceId }))
      );
      return sortByCreatedAtDesc(results.flat());
    },

    create: async (accessToken, _userId, input) => {
      const res = await createBackendClient(accessToken).api.v1.seeds.$post({
        json: input,
      });
      if (!res.ok) {
        throw new Error(`SeedRepository.create: backend request failed (${res.status})`);
      }
      const json = (await res.json()) as SeedCreate;
      if (!json.success) {
        throw new Error(json.message ?? 'SeedRepository.create: backend returned failure');
      }
      return json.data.seed;
    },

    update: async (accessToken, seedId, _userId, input) => {
      const res = await createBackendClient(accessToken).api.v1.seeds[':seedId'].$put({
        param: { seedId },
        json: input,
      });
      if (!res.ok) {
        throw new Error(`SeedRepository.update: backend request failed (${res.status})`);
      }
      const json = (await res.json()) as SeedUpdate;
      if (!json.success) {
        throw new Error(json.message ?? 'SeedRepository.update: backend returned failure');
      }
      return json.data.seed;
    },

    delete: async (accessToken, seedId) => {
      const res = await createBackendClient(accessToken).api.v1.seeds[':seedId'].$delete({
        param: { seedId },
      });
      if (!res.ok) {
        throw new Error(`SeedRepository.delete: backend request failed (${res.status})`);
      }
    },
  };
}

export const seedApiRepositoryImpl: SeedRepositorySpec = createSeedApiRepositoryImpl();

export const getSeedRepository = createSingletonProvider<SeedRepositorySpec>(
  () => seedApiRepositoryImpl
);
