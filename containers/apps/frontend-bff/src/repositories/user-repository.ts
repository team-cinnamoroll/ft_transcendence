import { type User } from "@/types/user";
import { currentUser, users } from "@/mocks/users";

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** UserRepository が提供するメソッドの型定義 */
export type UserRepository = {
  /** ログイン中ユーザーを取得 */
  getCurrentUser: () => User;
  /** ID でユーザーを1件取得（存在しない場合は undefined） */
  findById: (userId: string) => User | undefined;
  /** 全ユーザー一覧を取得 */
  listAll: () => User[];
};

// ─── モック実装 ────────────────────────────────────────────────

export const userRepository: UserRepository = {
  getCurrentUser: () => {
    return currentUser;
  },

  findById: (userId) => {
    return users.find((user) => user.id === userId);
  },

  listAll: () => {
    return users;
  },
};
