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

/**
 * 指定したユーザーのプロフィールを、閲覧者から見た関係(relationship)込みで取得する。
 *
 * id はモックのまま（Face/Seedのモック紐付け用）維持しつつ、
 * ログイン中は name/avatarUrl/badge を本物のプロフィールで上書きする。
 * モックの一覧に存在しない id でも、バックエンドに実在するユーザーであれば取得できる
 * （Seed経由などモックの id しか知らない経路と、実在ユーザーを直接指す経路の両方に対応するため）。
 * どちらの取得も失敗した場合のみ null を返す。
 */
export async function findUserById(userId: string): Promise<ProfileWithRelationship | null> {
  // 自分自身のモックIDを指している場合は、getCurrentUserと同じ本物データの上書きを行い、
  // プロフィールへのリンク用に id も本物のログインIDへ差し替える。
  // （そうしないと、Seed経由などモックIDのまま辿り着いた自分のプロフィールが
  // 本物のログインセッションと一致せず、他人として扱われてモックデータのままになってしまう）
  const displayUser = await getCurrentUser();
  if (userId === displayUser.id) {
    const session = await getAuthSession();
    return {
      ...displayUser,
      id: session?.userId ?? displayUser.id,
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
 * 自分自身に該当する項目だけは、getCurrentUser と同じように本物の name/avatar/badge で上書きする。
 *
 * 注意: id はモックのまま維持する。呼び出し元は多くの場合この一覧を
 * 「id をキーにした検索」（例: seed.userId で投稿者を探す）に使っており、
 * ここで id を本物のIDに差し替えてしまうと、モックIDでの検索がヒットしなくなってしまう。
 * プロフィールへのリンクに本物のIDが必要な場合は、呼び出し元で `findUserById` や
 * `linkableCurrentUser`（`getViewerContext` 参照）を使うこと。
 */
export async function listAllUsers(): Promise<UserProfile[]> {
  const [mockUsers, displayUser] = await Promise.all([
    getUserDirectoryRepository().listAll(),
    getCurrentUser(),
  ]);

  return mockUsers.map((u) => (u.id === displayUser.id ? displayUser : u));
}
