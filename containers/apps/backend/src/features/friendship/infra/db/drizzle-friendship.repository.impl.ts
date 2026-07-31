import { eq, or, and, desc, lt } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { SQL } from 'drizzle-orm';
import { friendships } from './schema';
import { userProfiles, UserProfileRow } from '../../../user-profile/infra/db/schema';
import type { FriendshipRepositorySpec } from '../../domain/friendship.repository';
import type { TracenDb } from '../../../../shared/infra/db/client';
import type {
  UserId,
  Friendship,
  FriendshipStatus,
  FriendshipId,
  FriendshipListRequest,
  FriendshipPendingListRequest,
} from '@tracen/contracts';
import {
  type UserProfileEntity,
  UserProfileEntitySchema,
} from '../../../user-profile/domain/user-profile.entity';
import type { FriendshipEntityCreateRequest } from '../../domain/friendship.entity';
import { makeSafeInfraResult } from '../../../../shared/utils/validation';

function mapUserProfile(row: Omit<UserProfileRow, 'createdAt' | 'updatedAt'>): UserProfileEntity {
  return makeSafeInfraResult(UserProfileEntitySchema, {
    id: row.id,
    name: row.name,
    badge: row.badge,
    avatarFileId: row.avatarFileId,
    userId: row.userId,
  });
}

class FriendshipDBRepositoryImpl implements FriendshipRepositorySpec {
  constructor(private readonly db: TracenDb) {}

  //2ユーザー間の関係性を取得（方向は順不同 A->B または B->A）
  async findByUserIds(userIdA: UserId, userIdB: UserId): Promise<Friendship | null> {
    const [row] = await this.db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, userIdA), eq(friendships.addresseeId, userIdB)),
          and(eq(friendships.requesterId, userIdB), eq(friendships.addresseeId, userIdA))
        )
      )
      .limit(1);

    if (!row) return null;

    return this.mapToFriendship(row);
  }

  // IDによる取得
  async findById(id: FriendshipId): Promise<Friendship | null> {
    const [row] = await this.db.select().from(friendships).where(eq(friendships.id, id)).limit(1);

    if (!row) return null;

    return this.mapToFriendship(row);
  }

  // 特定ユーザーの承認済みフレンド一覧をカーソル取得
  async findAcceptedFriends(
    userId: UserId,
    options: FriendshipListRequest
  ): Promise<{
    items: (Friendship & { requester: UserProfileEntity; addressee: UserProfileEntity })[];
    nextCursor: FriendshipId | null;
  }> {
    const { limit, cursor } = options;

    // カーソル（FriendshipId）が指定されている場合、その基準となる作成日時を取得
    let cursorCreatedAt: Date | undefined;
    if (cursor) {
      const target = await this.findById(cursor);
      if (target) {
        cursorCreatedAt = new Date(target.createdAt);
      }
    }

    // カーソル条件の構築（同一日時の場合は UUID で判定）
    const cursorCondition =
      cursor && cursorCreatedAt
        ? or(
            // パターンA: 明らかに作成日時が古い
            lt(friendships.createdAt, cursorCreatedAt),
            // パターンB: 作成日時が全く同じ場合は、ID (UUID) が小さい方を取得
            and(eq(friendships.createdAt, cursorCreatedAt), lt(friendships.id, cursor))
          )
        : undefined;

    // クエリ条件の構築
    const baseWhere = and(
      eq(friendships.status, 'ACCEPTED'),
      or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
      cursorCondition
    );

    // 一覧とそれぞれの UserProfile / Avatar 情報を取り出す JOIN クエリ
    const rows = await this.fetchFriendshipsWithProfiles(baseWhere, limit + 1);

    const hasNextPage = rows.length > limit;
    const itemsRows = hasNextPage ? rows.slice(0, limit) : rows;

    const items = itemsRows.map((r) => ({
      ...this.mapToFriendship(r.friendship),
      requester: mapUserProfile(r.requesterProfile),
      addressee: mapUserProfile(r.addresseeProfile),
    }));

    const lastItem = items[items.length - 1];
    const nextCursor = hasNextPage && lastItem ? lastItem.id : null;

    return { items, nextCursor };
  }

  // 特定ユーザーに関わる保留中の申請（送信/受信）一覧をカーソル取得
  async findPendingRequests(
    userId: UserId,
    options: FriendshipPendingListRequest
  ): Promise<{
    items: (Friendship & { requester: UserProfileEntity; addressee: UserProfileEntity })[];
    nextCursor: FriendshipId | null;
  }> {
    const { type, limit, cursor } = options;

    let cursorCreatedAt: Date | undefined;
    if (cursor) {
      const target = await this.findById(cursor);
      if (target) {
        cursorCreatedAt = new Date(target.createdAt);
      }
    }

    // type（incoming / outgoing）に応じた検索条件の切り替え
    const userCondition =
      type === 'incoming'
        ? eq(friendships.addresseeId, userId)
        : eq(friendships.requesterId, userId);

    const cursorCondition =
      cursor && cursorCreatedAt
        ? or(
            lt(friendships.createdAt, cursorCreatedAt),
            and(eq(friendships.createdAt, cursorCreatedAt), lt(friendships.id, cursor))
          )
        : undefined;

    const baseWhere = and(eq(friendships.status, 'PENDING'), userCondition, cursorCondition);

    const rows = await this.fetchFriendshipsWithProfiles(baseWhere, limit + 1);

    const hasNextPage = rows.length > limit;
    const itemsRows = hasNextPage ? rows.slice(0, limit) : rows;

    const items = itemsRows.map((r) => ({
      ...this.mapToFriendship(r.friendship),
      requester: mapUserProfile(r.requesterProfile),
      addressee: mapUserProfile(r.addresseeProfile),
    }));

    const lastItem = items[items.length - 1];
    const nextCursor = hasNextPage && lastItem ? lastItem.id : null;

    return { items, nextCursor };
  }

  // 新規のフレンド申請を作成（または再申請）
  async create(request: FriendshipEntityCreateRequest): Promise<Friendship> {
    const [row] = await this.db
      .insert(friendships)
      .values({
        requesterId: request.requesterId,
        addresseeId: request.addresseeId,
        status: 'PENDING' as const,
      })
      .onConflictDoUpdate({
        target: [friendships.requesterId, friendships.addresseeId],
        set: {
          status: 'PENDING',
          updatedAt: new Date(),
        },
      })
      .returning();

    return this.mapToFriendship(row);
  }

  // ステータスを更新（承認・拒否・ブロックなど）
  async updateStatus(id: FriendshipId, status: FriendshipStatus): Promise<Friendship> {
    const [row] = await this.db
      .update(friendships)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(friendships.id, id))
      .returning();

    if (!row) {
      throw new Error(`Friendship with id ${id} not found.`);
    }

    return this.mapToFriendship(row);
  }

  // フレンド関係の解除（物理削除、またはステータス変更）
  async delete(id: FriendshipId): Promise<void> {
    await this.db.delete(friendships).where(eq(friendships.id, id));
  }

  // -----------------------------------------------------------------
  // Private Helper Methods
  // -----------------------------------------------------------------

  /**
   * DBのRowオブジェクトを Friendship 型（ISO日時文字列）へ安全にマッピング
   */
  private mapToFriendship(row: typeof friendships.$inferSelect): Friendship {
    return {
      id: row.id,
      requesterId: row.requesterId,
      addresseeId: row.addresseeId,
      status: row.status as FriendshipStatus,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Friendshipに紐づく requester / addressee の UserProfile + Avatar をまとめて取得するサブクエリJOIN
   */
  private async fetchFriendshipsWithProfiles(whereCondition: SQL | undefined, fetchLimit: number) {
    // requesterとaddresseeの2つのプロフィールおよびAvatarファイルを同時にエイリアス取得するためにエイリアスを定義
    const reqProfileTable = alias(userProfiles, 'req_profile');
    const addProfileTable = alias(userProfiles, 'add_profile');

    return await this.db
      .select({
        friendship: friendships,
        requesterProfile: {
          id: reqProfileTable.id,
          name: reqProfileTable.name,
          badge: reqProfileTable.badge,
          avatarFileId: reqProfileTable.avatarFileId,
          userId: reqProfileTable.userId,
        },
        addresseeProfile: {
          id: addProfileTable.id,
          name: addProfileTable.name,
          badge: addProfileTable.badge,
          avatarFileId: addProfileTable.avatarFileId,
          userId: addProfileTable.userId,
        },
      })
      .from(friendships)
      // Requester Profile & Avatar File JOIN
      .innerJoin(reqProfileTable, eq(friendships.requesterId, reqProfileTable.userId))
      // Addressee Profile & Avatar File JOIN
      .innerJoin(addProfileTable, eq(friendships.addresseeId, addProfileTable.userId))
      .where(whereCondition)
      // 第1優先: createdAt の降順, 第2優先: id の降順
      .orderBy(desc(friendships.createdAt), desc(friendships.id))
      .limit(fetchLimit);
  }
}

export function createDrizzleFriendshipRepository(db: TracenDb): FriendshipRepositorySpec {
  return new FriendshipDBRepositoryImpl(db);
}
