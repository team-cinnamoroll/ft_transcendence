/**
 * @/server/actions/faces のモック。
 * Storybook 環境では 'use server' / next/cache が使えないため、
 * 本物の server/actions/faces.ts と同じ関数名・戻り値の形(ActionResult/ApiResult)を持つ偽実装で置き換える。
 */
import type { Face, FaceSummary, FaceSummaryPage } from '../../src/types/face';
import type { ApiResult } from '../../src/lib/api-error';
import type { ActionResult } from '../../src/server/actions/result';

type CreateFaceInput = {
  name: string;
  emoji: string | null;
  description: string | null;
  imageId: string | null;
  visibility: 'public' | 'private';
};

export async function createFaceAction(input: unknown): Promise<ActionResult<Face>> {
  const data = input as CreateFaceInput;
  return {
    success: true,
    data: {
      id: `face-mock-${Date.now()}`,
      userId: 'user-1',
      name: data.name,
      emoji: data.emoji ?? null,
      description: data.description ?? null,
      visibility: data.visibility,
      image: null,
    },
  };
}

export async function updateFaceAction(
  faceId: string,
  input: unknown
): Promise<ActionResult<Face>> {
  const data = input as CreateFaceInput;
  return {
    success: true,
    data: {
      id: faceId,
      userId: 'user-1',
      name: data.name,
      emoji: data.emoji ?? null,
      description: data.description ?? null,
      visibility: data.visibility,
      image: null,
    },
  };
}

export async function deleteFaceAction(): Promise<ActionResult<void>> {
  return { success: true, data: undefined };
}

/** キーワードでフェイスを検索する(検索バー用)のモック。Storybookでは常に空を返す */
export async function searchFacesAction(): Promise<FaceSummary[]> {
  return [];
}

/** 指定ユーザーのフェイス一覧の続きを取得する(「もっと見る」用)のモック。Storybookでは常に空を返す */
export async function loadMoreFacesAction(): Promise<ApiResult<FaceSummaryPage>> {
  return { success: true, data: { faceSummaries: [], nextCursor: null } };
}

type UploadFaceImageResult =
  { success: true; fileId: string } | { success: false; message: string };

export async function uploadFaceImageAction(): Promise<ActionResult<UploadFaceImageResult>> {
  return {
    success: true,
    data: { success: true, fileId: `mock-file-${Date.now()}` },
  };
}
