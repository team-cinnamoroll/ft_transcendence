'use server';

import type { UserProfile } from '@/types/user-profile';
import { findUsersByIds } from '@/server/usecases/users';

/** 検索結果などクライアント側で新たに登場したユーザーIDのプロフィールをまとめて取得する */
export async function findUsersByIdsAction(userIds: string[]): Promise<UserProfile[]> {
  return findUsersByIds(userIds);
}
