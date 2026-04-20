import 'server-only';

import { type User } from '@/types/user';
import { currentUser, users } from '@/mocks/users';
import { createSingletonProvider } from '@/repositories/provider';

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** UserRepository が提供するメソッドの契約（Spec） */
export type UserRepositorySpec = {
  /** ログイン中ユーザーを取得 */
  getCurrentUser: () => Promise<User>;
  /** ID でユーザーを1件取得（存在しない場合は null） */
  findById: (userId: string) => Promise<User | null>;
  /** 全ユーザー一覧を取得 */
  listAll: () => Promise<User[]>;
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
  };
}

export const userMockRepositoryImpl: UserRepositorySpec = createUserMockRepositoryImpl();

/** Provider: DI の入口 */
export const getUserRepository = createSingletonProvider<UserRepositorySpec>(
  () => userMockRepositoryImpl
);

/** 互換用: 従来の import 口（Server 側でのみ使用する） */
export const userRepository: UserRepositorySpec = getUserRepository();
