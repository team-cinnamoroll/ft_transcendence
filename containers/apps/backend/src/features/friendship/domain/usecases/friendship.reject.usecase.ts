import { FriendshipRepositorySpec } from '../../domain/friendship.repository';
import type { Friendship, UserId, FriendshipId } from '@tracen/contracts';
import { FriendshipSchema } from '@tracen/contracts';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../../../../shared/errors/global.error';
import { makeSafeUsecaseResult } from '../../../../shared/utils/validation';

// フレンド申請の取り消し・拒否ユースケース
export async function rejectFriendship(
  friendshipRepo: FriendshipRepositorySpec,
  requestId: FriendshipId,
  requesterId: UserId
): Promise<Friendship | null> {
  const friendship = await friendshipRepo.findById(requestId);
  if (!friendship) {
    throw new NotFoundError('Friendship request not found.');
  }
  // 当事者（送信者または受信者）しか取り消し・拒否はできない
  const isRequester = friendship.requesterId === requesterId;
  const isAddressee = friendship.addresseeId === requesterId;
  if (!isRequester && !isAddressee) {
    throw new ForbiddenError('You are not authorized to reject this friendship request.');
  }

  // 送信者が取り消す場合は、ステータスが PENDING である必要がある
  if (isRequester && friendship.status !== 'PENDING') {
    throw new ValidationError('This friendship request is not pending and cannot be rejected.');
  }

  if (isRequester) {
    // 送信者が取り消す場合は、レコードを削除
    await friendshipRepo.delete(requestId);
    return null;
  } else {
    if (friendship.status === 'BLOCKED') {
      // 受信者がすでに拒否済みの場合は、レコードを削除
      await friendshipRepo.delete(requestId);
      return null;
    } else {
      // 受信者が拒否する場合は、ステータスを "BLOCKED" に更新
      const updatedFriendship = await friendshipRepo.updateStatus(requestId, 'BLOCKED');
      return makeSafeUsecaseResult(FriendshipSchema, updatedFriendship);
    }
  }
}
