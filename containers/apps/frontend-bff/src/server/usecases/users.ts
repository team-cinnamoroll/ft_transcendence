import 'server-only';

import type { UserProfile, UserProfileUpsertRequest } from '@/types/user-profile';
import type { ApiResult } from '@/lib/api-error';
import { getUserDirectoryRepository } from '@/repositories/user-directory-repository';
import { getUserProfileRepository } from '@/repositories/user-profile-repository';
import { getAuthSession } from './auth';

/**
 * ログイン中ユーザーを取得する。
 * id はモックのまま（Face/Seedのモック紐付け用）維持しつつ、
 * ログイン中は name/avatarUrl/badge を本物のプロフィールで上書きする。
 * 未ログイン、または本物のプロフィール取得に失敗した場合はモックをそのまま返す。
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const mockUser = await getUserDirectoryRepository().getCurrentUser();

  const session = await getAuthSession();
  if (!session) {
    return mockUser;
  }

  const realProfile = await getUserProfileRepository().getMyProfile(session.accessToken);
  if (!realProfile) {
    return mockUser;
  }

  return {
    ...mockUser,
    name: realProfile.name,
    avatar: realProfile.avatar || null,
    badge: realProfile.badge,
  };
}

export async function findUserById(userId: string): Promise<UserProfile | null> {
  return await getUserDirectoryRepository().findById(userId);
}

/** ログイン中の自分のプロフィールを更新する（accessToken/userId はセッションから取得済みのものを渡す） */
export async function updateMyProfile(
  userId: string,
  accessToken: string,
  input: UserProfileUpsertRequest
): Promise<ApiResult<void>> {
  return await getUserProfileRepository().updateMyProfile(accessToken, userId, input);
}

export async function listAllUsers(): Promise<UserProfile[]> {
  return await getUserDirectoryRepository().listAll();
}
