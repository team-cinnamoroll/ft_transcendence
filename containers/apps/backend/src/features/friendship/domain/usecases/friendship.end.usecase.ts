import { FriendshipRepositorySpec } from '../../domain/friendship.repository';
import type { UserId } from '@tracen/contracts';
import { NotFoundError } from '../../../../shared/errors/global.error';

// フレンド関係の解除ユースケース
export async function endFriendship(
  friendshipRepo: FriendshipRepositorySpec,
  requesterId: UserId,
  addresseeId: UserId
): Promise<void> {
  // 2ユーザー間のFriendshipが存在するか
  const friendship = await friendshipRepo.findByUserIds(requesterId, addresseeId);
  if (!friendship || friendship.status !== 'ACCEPTED') {
    throw new NotFoundError('Friendship not found.');
  }

  // 関係性の削除
  await friendshipRepo.delete(friendship.id);
}
