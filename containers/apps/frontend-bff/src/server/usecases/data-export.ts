import 'server-only';

import type { Face } from '@/types/face';
import type { Seed } from '@/types/seed';
import type { UserProfile } from '@/types/user-profile';
import { getCurrentUser } from './users';
import { listFacesByUserId } from './faces';
import { listSeedsByUserId } from './seeds';
import { getSubscribedFaceIds } from './subscriptions';

/**
 * GDPR エクスポートで返すユーザーデータ一式。
 * backend #147 (GET /users/me/export) と同じ項目構成に揃え、実API化時に Provider 差し替えで 1:1 になるようにする。
 * links は seed の linkedSeedIds に内包。blocks は frontend 未実装のため現時点では含めない。
 */
export type UserDataExport = {
  /** エクスポート実行時刻（ISO 8601） */
  exportedAt: string;
  profile: UserProfile;
  faces: Face[];
  /** アクティビティ（このコードベースでは Seed が activity に相当。#205/#206 で統一） */
  seeds: Seed[];
  /** 購読中フェイスの ID 一覧 */
  subscribedFaceIds: string[];
};

/**
 * ログイン中ユーザーの全データを集約して返す。
 * 既存の read 系ユースケースを合成するのみで、新しい mock メソッドは追加しない。
 */
export async function exportCurrentUserData(): Promise<UserDataExport> {
  const currentUser = await getCurrentUser();

  const [faces, seeds, subscribedFaceIds] = await Promise.all([
    listFacesByUserId(currentUser.id),
    listSeedsByUserId(currentUser.id),
    getSubscribedFaceIds(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: currentUser,
    faces,
    seeds,
    subscribedFaceIds,
  };
}
