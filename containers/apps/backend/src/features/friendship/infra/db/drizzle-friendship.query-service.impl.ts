import { eq, or, and, inArray } from 'drizzle-orm';
import { friendships, type FriendshipRow } from './schema';
import type { UserId, Friendship } from '@tracen/contracts';
import type { TracenDb } from '../../../../shared/infra/db/client';

import type { FriendshipQueryServiceSpec } from '../../../../core-domain/friendship/friendship.query-service';

class FriendshipDBQueryServiceImpl implements FriendshipQueryServiceSpec {
  constructor(private readonly db: TracenDb) {}

  private mapToFriendship(row: FriendshipRow): Friendship {
    return {
      id: row.id,
      requesterId: row.requesterId,
      addresseeId: row.addresseeId,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  //1ユーザーに関しての複数ユーザー間の関係性を取得
  async findByOtherIds(userId: UserId, otherUserIds: UserId[]): Promise<(Friendship | null)[]> {
    if (otherUserIds.length === 0) {
      return [];
    }

    // IN句 (inArray) を使った高速で安全なクエリ
    const rows = await this.db
      .select()
      .from(friendships)
      .where(
        or(
          // パターンA: 自分が申請者 ＆ 相手が otherUserIds のいずれか
          and(eq(friendships.requesterId, userId), inArray(friendships.addresseeId, otherUserIds)),
          // パターンB: 自分が受信者 ＆ 相手が otherUserIds のいずれか
          and(eq(friendships.addresseeId, userId), inArray(friendships.requesterId, otherUserIds))
        )
      );

    // 3. マッピング処理
    return otherUserIds.map((otherId) => {
      // 自分自身とのフレンド関係は存在しないため、配列探索をスキップして確実に null を返す
      if (otherId === userId) {
        return null;
      }

      const row = rows.find(
        (r) =>
          (r.requesterId === userId && r.addresseeId === otherId) ||
          (r.requesterId === otherId && r.addresseeId === userId)
      );

      return row ? this.mapToFriendship(row) : null;
    });
  }
}

export function createDrizzleFriendshipQueryService(db: TracenDb): FriendshipQueryServiceSpec {
  return new FriendshipDBQueryServiceImpl(db);
}
