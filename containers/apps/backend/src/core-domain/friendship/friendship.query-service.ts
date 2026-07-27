import type { UserId, Friendship } from '@tracen/contracts';

export interface FriendshipQueryServiceSpec {
  //1ユーザーに関しての複数ユーザー間の関係性を取得
  findByOtherIds(userId: UserId, otherUserIds: UserId[]): Promise<(Friendship | null)[]>;
}
