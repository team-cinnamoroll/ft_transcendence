import 'server-only';

import type { UserProfile } from '@/types/user-profile';
import type { UserMe } from '@/types/user';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** UserProfileRepository が提供するメソッドの契約（Spec） */
export type UserProfileRepositorySpec = {
  /** ログイン中の自分のプロフィールを取得（取得できない場合は null） */
  getMyProfile: (accessToken: string) => Promise<UserProfile | null>;
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
  };
}

export const userProfileApiRepositoryImpl: UserProfileRepositorySpec =
  createUserProfileApiRepositoryImpl();

/** Provider: DI の入口（実装の選択はここに閉じ込める） */
export const getUserProfileRepository = createSingletonProvider<UserProfileRepositorySpec>(
  () => userProfileApiRepositoryImpl
);
