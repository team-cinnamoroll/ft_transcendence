import 'server-only';

import type {
  UserProfile,
  UserProfileUpsertRequest,
  ProfileWithRelationship,
} from '@/types/user-profile';
import type { ApiResult } from '@/lib/api-error';
import { getUserProfileRepository } from '@/repositories/user-profile-repository';
import { getAuthSession } from './auth';

/**
 * ログイン中ユーザーを取得する。
 * ページ保護により、この関数は保護されたページの中でしか呼ばれない
 * （＝呼ばれた時点で必ずログイン済み）ことが前提になっている。
 * 未ログイン、または本物のプロフィール取得に失敗した場合は例外をthrowし、
 * error.tsx による汎用エラー表示に委ねる（モックへのフォールバックはしない）。
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const session = await getAuthSession();
  if (!session) {
    throw new Error('getCurrentUser: 未ログイン状態で呼び出されました');
  }

  const profile = await getUserProfileRepository().getMyProfile(session.accessToken);
  if (!profile) {
    throw new Error('getCurrentUser: プロフィールの取得に失敗しました');
  }

  return profile;
}

/**
 * 指定したユーザーのプロフィールを、閲覧者から見た関係(relationship)込みで取得する。
 *
 * 「自分自身」を指す場合は getCurrentUser と同じ扱いになる（未ログイン・取得失敗は例外throw）。
 * 「他人」のプロフィールが見つからない場合は、実在しない userId が指定された場合など
 * 正常系でも起こりうるため、null を返す（呼び出し元で「見つかりません」表示に使う）。
 */
export async function findUserById(userId: string): Promise<ProfileWithRelationship | null> {
  // 自分自身を指している場合は、getCurrentUserの結果に relationship: null を添えて返す。
  const displayUser = await getCurrentUser();
  if (userId === displayUser.id) {
    return {
      ...displayUser,
      relationship: null,
    };
  }

  const session = await getAuthSession();
  if (!session) {
    throw new Error('findUserById: 未ログイン状態で呼び出されました');
  }

  return await getUserProfileRepository().getProfileById(session.accessToken, userId);
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
