import 'server-only';

import type { Face } from '@/types/face';
import type { Seed } from '@/types/seed';
import type { Notification } from '@/types/notification';
import type { UserProfile } from '@/types/user-profile';
import { getCurrentUser } from './users';
import { listFacesByUserId } from './faces';
import { listSeedsByUserId } from './seeds';
import { getSubscribedFaceIds } from './subscriptions';
import { listNotifications } from './notifications';
import { getAuthSession } from './auth';

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
  notifications: Notification[];
};

/**
 * ログイン中ユーザーの全データを集約して返す。
 * 既存の read 系ユースケースを合成するのみで、新しい mock メソッドは追加しない。
 */
export async function exportCurrentUserData(): Promise<UserDataExport> {
  const currentUser = await getCurrentUser();
  const session = await getAuthSession();

  const [faces, seeds, subscribedFaceIds, notifications] = await Promise.all([
    // Faceは本物のバックエンドAPIに接続済みのため、モックID(currentUser.id)ではなく
    // 本物のログインID(session.userId)で取得する必要がある(#314で発覚した不整合への暫定対応、#318で解消予定)
    listFacesByUserId(session?.userId ?? currentUser.id),
    // SeedはまだモックデータのままなのでcurrentUser.id(モックID)を使い続ける
    listSeedsByUserId(currentUser.id),
    getSubscribedFaceIds(),
    listNotifications(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: currentUser,
    faces,
    seeds,
    subscribedFaceIds,
    notifications,
  };
}
