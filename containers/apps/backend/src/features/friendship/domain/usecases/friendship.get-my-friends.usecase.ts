import type { FriendshipRepositorySpec } from '../../domain/friendship.repository';
import type { PresenceRepositorySpec } from '../../../presence/domain/presence.repository';
import { type FileQueryServiceSpec } from '../../../../core-domain/file/file.query-service';
import type {
  FriendProfileWithOnlineStatus,
  UserId,
  FriendProfile,
  ListRequestLimit,
  FriendshipIdCursor,
} from '@tracen/contracts';
import {
  FriendProfileSchema,
  FriendProfileWithOnlineStatusSchema,
  FriendshipListRequestSchema,
} from '@tracen/contracts';
import { type UserProfileEntity } from '../../../user-profile/domain/user-profile.entity';
import { getOnlineStatuses } from '../../../presence/domain/presence.usecase';
import { toUserProfiles } from '../../../user-profile/domain/user-profile.create-init.usecase';
import { makeSafeUsecaseResult } from '../../../../shared/utils/validation';

// 承認済みフレンド一覧の取得ユースケース
export async function getMyFriends(
  friendshipRepo: FriendshipRepositorySpec,
  presenceRepo: PresenceRepositorySpec,
  fileQueryService: FileQueryServiceSpec,
  requesterId: UserId,
  { limit, cursor }: { limit: ListRequestLimit; cursor?: FriendshipIdCursor }
): Promise<[FriendProfileWithOnlineStatus[], FriendshipIdCursor]> {
  const requestRange = makeSafeUsecaseResult(FriendshipListRequestSchema, {
    limit,
    cursor: cursor ?? null, // nullの場合は最初のページ
  });
  // リポジトリからデータを取得
  const { items, nextCursor } = await friendshipRepo.findAcceptedFriends(requesterId, requestRange);

  const UserProfileEntities: UserProfileEntity[] = items.map((friendship) =>
    friendship.requesterId === requesterId ? friendship.addressee : friendship.requester
  );
  // ユーザープロフィールを取得
  const UserProfiles = await toUserProfiles(UserProfileEntities, fileQueryService);
  const friendProfiles: FriendProfile[] = items.map((friendship, index) => {
    return makeSafeUsecaseResult(FriendProfileSchema, {
      friendshipId: friendship.id,
      friendProfile: UserProfiles[index],
      becameFriendsAt: friendship.updatedAt,
    });
  });

  const friendIds: UserId[] = friendProfiles.map((friendProfile) => friendProfile.friendProfile.id);

  // オンラインステータスを取得
  const onlineStatuses = await getOnlineStatuses(presenceRepo, friendIds);

  // オンラインステータスを付与する処理
  const friendProfilesWithOnlineStatus: FriendProfileWithOnlineStatus[] = friendProfiles.map(
    (friendProfile) =>
      makeSafeUsecaseResult(FriendProfileWithOnlineStatusSchema, {
        ...friendProfile,
        isOnline: onlineStatuses[friendProfile.friendProfile.id] ?? false,
      })
  );

  return [friendProfilesWithOnlineStatus, nextCursor];
}
