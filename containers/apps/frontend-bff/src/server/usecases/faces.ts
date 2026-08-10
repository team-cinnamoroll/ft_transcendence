import 'server-only';

import type { Face, FaceSummary, FaceSummaryPage } from '@/types/face';
import {
  type CreateFaceInput,
  type UpdateFaceInput,
  getFaceRepository,
} from '@/repositories/face-repository';
import { getSessionTokens } from '@/lib/session';
import type { ApiResult } from '@/lib/api-error';

export async function listFacesByUserId(userId: string): Promise<Face[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return await getFaceRepository().listByUserId(accessToken, userId);
}

/** 指定ユーザーのフェイス一覧を1ページ分だけ取得する(「もっと見る」用) */
export async function listFacesPageByUserId(
  userId: string,
  cursor?: string | null
): Promise<ApiResult<FaceSummaryPage>> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return { success: false, errorKind: 'UNAUTHORIZED' };
  }
  return await getFaceRepository().listPageByUserId(accessToken, { userId, cursor });
}

export async function listAllFaces(): Promise<Face[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return await getFaceRepository().listAll(accessToken);
}

/**
 * キーワードでフェイスを検索する。
 * userIdを指定すると対象ユーザーのフェイスのみに絞り込める(未指定なら全体)。
 * lastPostedAt/numberOfPostsはクライアント側でのソートに使うため、FaceSummaryのまま返す。
 */
export async function searchFaces(query: { q?: string; userId?: string }): Promise<FaceSummary[]> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return [];
  }
  return await getFaceRepository().search(accessToken, query);
}

export async function findFaceById(faceId: string): Promise<Face | null> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    return null;
  }
  return await getFaceRepository().findById(accessToken, faceId);
}

export async function createFace(input: CreateFaceInput): Promise<Face> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('createFace: not authenticated');
  }
  return await getFaceRepository().create(accessToken, input);
}

export async function updateFace(faceId: string, input: UpdateFaceInput): Promise<Face> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('updateFace: not authenticated');
  }
  return await getFaceRepository().update(accessToken, faceId, input);
}

export async function deleteFace(faceId: string): Promise<void> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new Error('deleteFace: not authenticated');
  }
  return await getFaceRepository().delete(accessToken, faceId);
}
