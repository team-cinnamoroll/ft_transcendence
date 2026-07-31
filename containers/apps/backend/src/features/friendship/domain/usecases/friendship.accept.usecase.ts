import { FriendshipRepositorySpec } from '../../domain/friendship.repository';
import type { Friendship, UserId, FriendshipId } from '@tracen/contracts';
import { FriendshipSchema } from '@tracen/contracts';
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../../../shared/errors/global.error';
import { makeSafeUsecaseResult } from '../../../../shared/utils/validation';

// フレンド申請の承認ユースケース
export async function acceptFriendship(
  friendshipRepo: FriendshipRepositorySpec,
  requestId: FriendshipId,
  requesterId: UserId
): Promise<Friendship> {
  const friendship = await friendshipRepo.findById(requestId);
  if (!friendship) {
    throw new NotFoundError('Friendship request not found.');
  }
  // 承認権限のチェック（自分宛ての申請か？）
  if (friendship.addresseeId !== requesterId) {
    throw new UnauthorizedError('You are not authorized to accept this friendship request.');
  }
  // すでに承認済みでないかのチェック
  if (friendship.status === 'ACCEPTED') {
    throw new ConflictError('This friendship request is already accepted.');
  }
  // すでに承認済みでないか、または拒否済みでないかのチェック
  if (friendship.status === 'BLOCKED') {
    throw new ForbiddenError('This friendship request is not pending and cannot be accepted.');
  }

  // ステータスを ACCEPTED に更新
  const updatedFriendship = await friendshipRepo.updateStatus(requestId, 'ACCEPTED');
  return makeSafeUsecaseResult(FriendshipSchema, updatedFriendship);
}
