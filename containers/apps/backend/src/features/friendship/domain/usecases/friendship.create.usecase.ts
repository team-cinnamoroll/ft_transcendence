import { FriendshipRepositorySpec } from '../../domain/friendship.repository';
import type { Friendship, UserId } from '@tracen/contracts';
import { FriendshipEntityCreateRequestSchema } from '../friendship.entity';
import {
  ValidationError,
  InternalValidationError,
  ConflictError,
  ForbiddenError,
} from '../../../../shared/errors/global.error';
import { makeSafeUsecaseResult } from '../../../../shared/utils/validation';

// フレンド申請の作成（または再申請）ユースケース
export async function createFriendship(
  friendshipRepo: FriendshipRepositorySpec,
  requesterId: UserId,
  addresseeId: UserId
): Promise<Friendship> {
  // 1. 自分自身への申請チェック
  if (addresseeId === requesterId) {
    throw new ValidationError('You cannot send a friend request to yourself.');
  }
  // 2. 既存の関係性をチェック
  const existingFriendship = await friendshipRepo.findByUserIds(requesterId, addresseeId);
  if (existingFriendship) {
    switch (existingFriendship.status) {
      case 'ACCEPTED':
        throw new ConflictError('You are already friends with this user.');
      case 'PENDING':
        throw new ConflictError('A friend request is already pending with this user.');
      case 'BLOCKED':
        throw new ForbiddenError(
          'You cannot send a friend request to this user as they have blocked you.'
        );
      default:
        throw new InternalValidationError(
          `Unexpected friendship status: ${existingFriendship.status}`
        );
    }
  }
  // 3. 申請の作成
  const request = makeSafeUsecaseResult(FriendshipEntityCreateRequestSchema, {
    requesterId,
    addresseeId,
  });
  const createdFriendship = await friendshipRepo.create(request);
  return createdFriendship;
}
