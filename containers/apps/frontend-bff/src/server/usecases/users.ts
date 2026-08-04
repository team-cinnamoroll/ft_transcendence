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
 * 組み立てたい場合に使う（`listAllUsers()` はモックIDベースのため、本物のIDと一致しない）。
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

/**
 * 全ユーザー一覧を取得する。
 * 自分自身に該当する項目だけは、getCurrentUser と同じように本物の name/avatar/badge/id で上書きする。
 *
 * 注意: 一覧のうち自分以外の項目は id がモックのままである
 * （Face/Seedのモックデータとの紐付け用一覧として残っているため）。
 * 「id をキーにした検索」（例: seed.userId で投稿者を探す）にこの一覧を使う場合、
 * 相手が実在ユーザーであれば本物の id と一致しない点に注意すること。
 * 自分自身を検出するために、mockUsers 側とは別に `getUserDirectoryRepository().getCurrentUser()`
 * （モックIDのまま）を取得し、モックID同士で比較している。
 */
export async function listAllUsers(): Promise<UserProfile[]> {
  const [mockUsers, mockCurrentUser, displayUser] = await Promise.all([
    getUserDirectoryRepository().listAll(),
    getUserDirectoryRepository().getCurrentUser(),
    getCurrentUser(),
  ]);

  return mockUsers.map((u) => (u.id === mockCurrentUser.id ? displayUser : u));
}
