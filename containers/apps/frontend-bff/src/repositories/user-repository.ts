import 'server-only';

import { type UserProfile } from '@/types/user-profile';
import { currentUser, users } from '@/mocks/users';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** プロフィール更新時の入力型 */
export type UpdateProfileInput = {
  name: string;
  avatarUrl: string;
  badge?: string;
};

/** UserRepository が提供するメソッドの契約（Spec） */
export type UserRepositorySpec = {
  /** ログイン中ユーザーを取得 */
  getCurrentUser: () => Promise<UserProfile>;
  /** ID でユーザーを1件取得（存在しない場合は null） */
  findById: (userId: string) => Promise<UserProfile | null>;
  /** 全ユーザー一覧を取得 */
  listAll: () => Promise<UserProfile[]>;
  /** プロフィールを更新（モック実装は更新後の値を返すだけ） */
  updateProfile: (userId: string, input: UpdateProfileInput) => Promise<UserProfile>;
};

// ─── モック実装 ────────────────────────────────────────────────

export function createUserMockRepositoryImpl(): UserRepositorySpec {
  return {
    getCurrentUser: async () => {
      return currentUser;
    },

    findById: async (userId) => {
      return users.find((user) => user.id === userId) ?? null;
    },

    listAll: async () => {
      return users;
    },

    updateProfile: async (userId, input) => {
      // モック実装: 入力をマージした更新後プロフィールを返すだけ（実際には保存しない）
      const base = users.find((user) => user.id === userId) ?? currentUser;
      return {
        ...base,
        name: input.name,
        avatarUrl: input.avatarUrl,
        badge: input.badge,
      };
    },
  };
}

export const userMockRepositoryImpl: UserRepositorySpec = createUserMockRepositoryImpl();

/** Provider: DI の入口 */
export const getUserRepository = createSingletonProvider<UserRepositorySpec>(
  () => userMockRepositoryImpl
);

/** 互換用: 従来の import 口（Server 側でのみ使用する） */
export const userRepository: UserRepositorySpec = getUserRepository();
