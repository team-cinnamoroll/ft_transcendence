import 'server-only';

import type {
  UserProfile,
  UserProfileUpsertRequest,
  ProfileWithRelationship,
} from '@/types/user-profile';
import type { ApiResult } from '@/lib/api-error';
import { getUserDirectoryRepository } from '@/repositories/user-directory-repository';
import { getUserProfileRepository } from '@/repositories/user-profile-repository';
import { getAuthSession } from './auth';

/**
 * ログイン中ユーザーを取得する。
 * ログイン中は id/name/avatarUrl/badge をすべて本物のプロフィールで上書きする
 * （Face/Seedが本物のバックエンドAPIに接続済みのため、id もモックのまま維持する必要がなくなった）。
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
    id: session.userId,
    name: realProfile.name,
    avatar: realProfile.avatar || null,
    badge: realProfile.badge,
  };
}

/**
 * 指定したユーザーのプロフィールを、閲覧者から見た関係(relationship)込みで取得する。
 *
 * ログイン中は name/avatarUrl/badge を本物のプロフィールで上書きする。
 * モックの一覧に存在しない id でも、バックエンドに実在するユーザーであれば取得できる
 * （Seed経由などモックの id しか知らない経路と、実在ユーザーを直接指す経路の両方に対応するため）。
 * どちらの取得も失敗した場合のみ null を返す。
 */
export async function findUserById(userId: string): Promise<ProfileWithRelationship | null> {
  // 自分自身を指している場合は、getCurrentUserと同じ本物データの上書きを行う。
  const displayUser = await getCurrentUser();
  if (userId === displayUser.id) {
    return {
      ...displayUser,
      relationship: null,
    };
  }

  const mockUser = await getUserDirectoryRepository().findById(userId);

  const session = await getAuthSession();
  const realProfile = session
    ? await getUserProfileRepository().getProfileById(session.accessToken, userId)
    : null;

  if (!mockUser && !realProfile) {
    return null;
  }

  if (realProfile) {
    return {
      id: userId,
      name: realProfile.name,
      avatar: realProfile.avatar || null,
      badge: realProfile.badge,
      relationship: realProfile.relationship,
    };
  }

  // realProfile が無い場合、上の null チェックにより mockUser は必ず存在する
  return { ...(mockUser as UserProfile), relationship: null };
}

/**
 * 複数の userId をまとめて解決する。
 * Seed投稿者一覧・Face所有者一覧など、表示対象の userId 集合から必要なユーザーだけを
 * 組み立てたい場合に使う。findUserById を userId ごとに並列実行するため、
 * モックの一覧をそのまま使う場合と異なり、本物のIDでも正しく解決できる。
 * 見つからなかった userId は結果から除外する。
 */
export async function findUsersByIds(userIds: string[]): Promise<UserProfile[]> {
  const uniqueIds = [...new Set(userIds)];
  const results = await Promise.all(uniqueIds.map((id) => findUserById(id)));
  return results.filter((u): u is ProfileWithRelationship => u !== null);
}

/** ログイン中の自分のプロフィールを更新する（accessToken/userId はセッションから取得済みのものを渡す） */
export async function updateMyProfile(
  userId: string,
  accessToken: string,
  input: UserProfileUpsertRequest
): Promise<ApiResult<void>> {
  return await getUserProfileRepository().updateMyProfile(accessToken, userId, input);
}
