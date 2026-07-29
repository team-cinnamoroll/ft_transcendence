import { FriendshipQueryServiceSpec } from '../../../../core-domain/friendship/friendship.query-service';
import {
  type UserId,
  type UserProfile,
  type UserProfileWithRelationship,
  type RelationshipStatus,
  type Friendship,
  UserProfileWithRelationshipSchema,
} from '@tracen/contracts';
import { makeSafeUsecaseResult } from '../../../../shared/utils/validation';

function determineRelationship(
  selfId: UserId,
  targetId: UserId,
  friendship: Friendship | null
): RelationshipStatus {
  // 1. 自分自身の場合
  if (selfId === targetId) {
    return 'SELF';
  }
  // 2. フレンド関係のレコードが存在しない場合
  if (!friendship) {
    return 'NONE';
  }
  // 3. レコードが存在する場合（ステータスや向きで判定）
  switch (friendship.status) {
    case 'ACCEPTED':
      return 'FRIEND';
    case 'PENDING':
      return friendship.requesterId === selfId ? 'PENDING_OUTGOING' : 'PENDING_INCOMING';
    case 'BLOCKED':
      return friendship.requesterId === selfId ? 'BLOCKED_BY' : 'BLOCKED';
    default:
      return 'NONE'; // 想定外のステータスの場合は NONE とする
  }
}

export async function toUserProfilesWithRelation(
  friendshipQueryService: FriendshipQueryServiceSpec,
  selfId: UserId,
  targetProfiles: UserProfile[]
): Promise<UserProfileWithRelationship[]> {
  const targetUserIds = targetProfiles.map((profile) => profile.id);
  const friendships = await friendshipQueryService.findByOtherIds(selfId, targetUserIds);

  return targetProfiles.map((profile, index) => {
    const friendship = friendships[index];
    return makeSafeUsecaseResult(UserProfileWithRelationshipSchema, {
      ...profile,
      relationship: {
        friendshipId: friendship ? friendship.id : null,
        status: determineRelationship(selfId, profile.id, friendship),
      },
    });
  });
}
