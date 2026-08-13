import 'server-only';

import type { Seed } from '@/types/seed';
import { getMyFriends } from './friendship';
import { listSeedsByUserId } from './seeds';

/**
 * フレンドが投稿したシードをまとめて新しい順に取得する。
 * フレンドの投稿だけをまとめて返す専用のバックエンドAPIは無いため、
 * 「フレンド一覧を取る→各フレンドの投稿を取る」の2段階で組み立てる。
 * フレンド一覧は1ページ目のみを対象とする(フレンド数が多い場合の全件走査は将来必要になった時点で対応する)。
 */
export async function listFriendSeeds(): Promise<Seed[]> {
  const friendsResult = await getMyFriends();
  if (!friendsResult.success) {
    return [];
  }

  const friendIds = friendsResult.data.friendships.map((f) => f.friendProfile.id);
  const seedsByFriend = await Promise.all(friendIds.map((id) => listSeedsByUserId(id)));

  return seedsByFriend
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
