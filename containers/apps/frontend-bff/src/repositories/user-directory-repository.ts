import 'server-only';

import { type UserProfile } from '@/types/user-profile';
import { currentUser, users } from '@/mocks/users';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** UserDirectoryRepository が提供するメソッドの契約（Spec） */
export type UserDirectoryRepositorySpec = {
  /** ログイン中ユーザーを取得 */
  getCurrentUser: () => Promise<UserProfile>;
  /** ID でユーザーを1件取得（存在しない場合は null） */
  findById: (userId: string) => Promise<UserProfile | null>;
  /** 全ユーザー一覧を取得 */
  listAll: () => Promise<UserProfile[]>;
};

// ─── モック実装 ────────────────────────────────────────────────

export function createUserDirectoryMockRepositoryImpl(): UserDirectoryRepositorySpec {
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
  };
}

export const userDirectoryMockRepositoryImpl: UserDirectoryRepositorySpec =
  createUserDirectoryMockRepositoryImpl();

/** Provider: DI の入口 */
export const getUserDirectoryRepository = createSingletonProvider<UserDirectoryRepositorySpec>(
  () => userDirectoryMockRepositoryImpl
);

/** 互換用: 従来の import 口（Server 側でのみ使用する） */
export const userDirectoryRepository: UserDirectoryRepositorySpec = getUserDirectoryRepository();
