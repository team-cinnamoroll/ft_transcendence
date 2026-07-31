import 'server-only';

import type {
  UserProfile,
  UserProfileUpsertRequest,
  UserProfilesResponse,
  UserProfileWithRelationship,
} from '@/types/user-profile';
import type { UserMe } from '@/types/user';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';
import { classifyHttpStatus, type ApiResult } from '@/lib/api-error';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** UserProfileRepository が提供するメソッドの契約（Spec） */
export type UserProfileRepositorySpec = {
  /** ログイン中の自分のプロフィールを取得（取得できない場合は null） */
  getMyProfile: (accessToken: string) => Promise<UserProfile | null>;
  /** 指定したユーザー（自分・他人問わず）のプロフィールを、関係(relationship)込みで1件取得（取得できない場合は null） */
  getProfileById: (
    accessToken: string,
    userId: string
  ) => Promise<UserProfileWithRelationship | null>;
  /** ログイン中の自分のプロフィールを更新（作成も兼ねる） */
  updateMyProfile: (
    accessToken: string,
    userId: string,
    input: UserProfileUpsertRequest
  ) => Promise<ApiResult<void>>;
};

// ─── バックエンドAPI実装 ────────────────────────────────────────
// ログイン中の本人にしか意味のないデータのため、他の repository と異なりモック実装は用意せず、
// 最初からバックエンドAPIを呼ぶ実装のみを提供する（auth-repository.ts と同じ考え方）。

export function createUserProfileApiRepositoryImpl(): UserProfileRepositorySpec {
  return {
    getMyProfile: async (accessToken) => {
      const res = await createBackendClient(accessToken).api.v1.users.me.$get();
      if (!res.ok) {
        console.error('UserProfileRepository.getMyProfile: backend request failed', res.status);
        return null;
      }
      const json = (await res.json()) as UserMe;
      if (!json.success) {
        return null;
      }
      return json.data.userProfile;
    },

    getProfileById: async (accessToken, userId) => {
      const res = await createBackendClient(accessToken).api.v1['user-profile'].profiles.$get({
        query: { ids: userId },
      });
      if (!res.ok) {
        console.error('UserProfileRepository.getProfileById: backend request failed', res.status);
        return null;
      }
      const json = (await res.json()) as UserProfilesResponse;
      if (!json.success) {
        return null;
      }
      return json.data.profileMap[userId] ?? null;
    },

    updateMyProfile: async (accessToken, userId, input) => {
      const res = await createBackendClient(accessToken).api.v1['user-profile'][':userId'].$put({
        param: { userId },
        json: input,
      });
      if (!res.ok) {
        // backend の生 message はログ用途のみ。画面表示には errorKind を使う（i18n非依存にするため）
        console.error('UserProfileRepository.updateMyProfile: backend request failed', res.status);
        return { success: false, errorKind: classifyHttpStatus(res.status) };
      }
      return { success: true, data: undefined };
    },
  };
}

export const userProfileApiRepositoryImpl: UserProfileRepositorySpec =
  createUserProfileApiRepositoryImpl();

/** Provider: DI の入口（実装の選択はここに閉じ込める） */
export const getUserProfileRepository = createSingletonProvider<UserProfileRepositorySpec>(
  () => userProfileApiRepositoryImpl
);
