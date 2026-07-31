import type {
  UserId,
  Friendship,
  FriendshipStatus,
  FriendshipId,
  FriendshipListRequest,
  FriendshipPendingListRequest,
  FriendshipIdCursor,
} from '@tracen/contracts';
import type { UserProfileEntity } from '../../user-profile/domain/user-profile.entity';
import type { FriendshipEntityCreateRequest } from './friendship.entity';

export interface FriendshipRepositorySpec {
  //2ユーザー間の関係性を取得（方向は順不同 A->B または B->A）
  findByUserIds(userIdA: UserId, userIdB: UserId): Promise<Friendship | null>;

  // IDによる取得
  findById(id: FriendshipId): Promise<Friendship | null>;

  // 特定ユーザーの承認済みフレンド一覧をカーソル取得
  findAcceptedFriends(
    userId: UserId,
    options: FriendshipListRequest
  ): Promise<{
    items: (Friendship & { requester: UserProfileEntity; addressee: UserProfileEntity })[];
    nextCursor: FriendshipIdCursor | null;
  }>;

  // 特定ユーザーに関わる保留中の申請（送信/受信）一覧をカーソル取得
  findPendingRequests(
    userId: UserId,
    options: FriendshipPendingListRequest
  ): Promise<{
    items: (Friendship & { requester: UserProfileEntity; addressee: UserProfileEntity })[];
    nextCursor: FriendshipIdCursor | null;
  }>;

  // 新規のフレンド申請を作成（または再申請）
  create(request: FriendshipEntityCreateRequest): Promise<Friendship>;

  // ステータスを更新（承認・拒否・ブロックなど）
  updateStatus(id: FriendshipId, status: FriendshipStatus): Promise<Friendship>;

  // フレンド関係の解除（物理削除、またはステータス変更）
  delete(id: FriendshipId): Promise<void>;
}
