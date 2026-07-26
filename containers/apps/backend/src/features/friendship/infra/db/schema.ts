import { pgTable, uuid, timestamp, pgEnum, index, unique } from 'drizzle-orm/pg-core';

import { users } from '../../../users/infra/db/schema'; // 既存のusersテーブル

// フレンド状態のEnum定義
export const friendshipStatusEnum = pgEnum('friendship_status', ['PENDING', 'ACCEPTED', 'BLOCKED']);

export const friendships = pgTable(
  'friendships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requesterId: uuid('requester_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // 申請者
    addresseeId: uuid('addressee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // 申請された人
    status: friendshipStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // 1. 重複申請防止（A -> B の同じ組み合わせの二重作成を防ぐ）
    unique('unique_requester_addressee').on(table.requesterId, table.addresseeId),
    // 2. 「自分が申請したデータ」の検索用（WHERE requester_id = ? AND status = ?）
    index('idx_friendships_requester_status').on(table.requesterId, table.status),
    // 3. 「自分宛ての申請」の検索用（WHERE addressee_id = ? AND status = ?）
    index('idx_friendships_addressee_status').on(table.addresseeId, table.status),
  ]
);

export type FriendshipRow = typeof friendships.$inferSelect;
export type NewFriendshipRow = typeof friendships.$inferInsert;
