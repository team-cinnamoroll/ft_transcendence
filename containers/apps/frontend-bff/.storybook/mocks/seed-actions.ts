/**
 * @/server/actions/seeds のモック。
 * Storybook 環境では 'use server' / next/cache が使えないため、
 * 本物の server/actions/seeds.ts と同じ関数名・戻り値の形(ActionResult/Seed[])を持つ偽実装で置き換える。
 */
import type { Seed } from '../../src/types/seed';
import type { ActionResult } from '../../src/server/actions/result';

type CreateSeedInput = {
  faceId: string;
  body: string;
  imageIds: string[];
};

type UpdateSeedInput = {
  body: string;
  imageIds: string[];
};

export async function createSeedAction(input: unknown): Promise<ActionResult<Seed>> {
  const data = input as CreateSeedInput;
  return {
    success: true,
    data: {
      id: `seed-mock-${Date.now()}`,
      faceId: data.faceId,
      userId: 'user-1',
      body: data.body,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function updateSeedAction(
  seedId: string,
  input: unknown
): Promise<ActionResult<Seed>> {
  const data = input as UpdateSeedInput;
  return {
    success: true,
    data: {
      id: seedId,
      faceId: 'face-mock',
      userId: 'user-1',
      body: data.body,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function deleteSeedAction(): Promise<ActionResult<void>> {
  return { success: true, data: undefined };
}

/** キーワードでシードを検索する(検索バー用)のモック。Storybookでは常に空を返す */
export async function searchSeedsAction(): Promise<Seed[]> {
  return [];
}

type UploadSeedImageResult =
  { success: true; fileId: string } | { success: false; message: string };

export async function uploadSeedImageAction(): Promise<ActionResult<UploadSeedImageResult>> {
  return {
    success: true,
    data: { success: true, fileId: `mock-seed-file-${Date.now()}` },
  };
}
