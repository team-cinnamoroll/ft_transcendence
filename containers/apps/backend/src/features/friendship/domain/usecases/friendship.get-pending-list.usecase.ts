import type { FriendshipRepositorySpec } from '../../domain/friendship.repository';
import { type FileQueryServiceSpec } from '../../../../core-domain/file/file.query-service';
import type {
  UserId,
  ListRequestLimit,
  FriendshipIdCursor,
  FriendshipPendingListType,
  UnconfirmedFriendProfile,
} from '@tracen/contracts';
import { type UserProfileEntity } from '../../../user-profile/domain/user-profile.entity';
import {
  FriendshipPendingListRequestSchema,
  UnconfirmedFriendProfileSchema,
} from '@tracen/contracts';
import { toUserProfiles } from '../../../user-profile/domain/usecases/user-profile.create-init.usecase';
import { makeSafeUsecaseResult } from '../../../../shared/utils/validation';

// フレンド申請一覧の取得（受信／送信）ユースケース
export async function getMyPendingFriends(
  friendshipRepo: FriendshipRepositorySpec,
  fileQueryService: FileQueryServiceSpec,
  requesterId: UserId,
  {
    type,
    limit,
    cursor,
  }: { type: FriendshipPendingListType; limit: ListRequestLimit; cursor?: FriendshipIdCursor }
): Promise<[UnconfirmedFriendProfile[], FriendshipIdCursor]> {
  const requestRange = makeSafeUsecaseResult(FriendshipPendingListRequestSchema, {
    type,
    limit,
    cursor: cursor ?? null, // nullの場合は最初のページ
  });
  // リポジトリからデータを取得
  const { items, nextCursor } = await friendshipRepo.findPendingRequests(requesterId, requestRange);

  const UserProfileEntities: UserProfileEntity[] = items.map((friendship) =>
    // incoming（受信）なら申請者(requester)、outgoing（送信）なら申請相手(addressee)
    type === 'incoming' ? friendship.requester : friendship.addressee
  );
  // ユーザープロフィールを取得
  const UserProfiles = await toUserProfiles(UserProfileEntities, fileQueryService);
  const pendingRequests: UnconfirmedFriendProfile[] = items.map((request, index) => {
    return makeSafeUsecaseResult(UnconfirmedFriendProfileSchema, {
      requestId: request.id,
      userProfile: UserProfiles[index],
      requestedAt: request.createdAt,
    });
  });

  return [pendingRequests, nextCursor];
}
