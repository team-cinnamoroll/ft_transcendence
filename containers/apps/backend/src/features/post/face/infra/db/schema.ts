import { pgTable, uuid, timestamp, pgEnum, index, text } from 'drizzle-orm/pg-core';

import { users } from '../../../../users/infra/db/schema'; // 既存のusersテーブル
import { fileMetadata } from '../../../../file-storage/infra/db/schema'; // 既存のfileMetadataテーブル

export const faceVisibilityEnum = pgEnum('face_visibility', ['public', 'private']);

export const faces = pgTable(
  'faces',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // 投稿者
    name: text('name').notNull(),
    emoji: text('emoji'),
    description: text('description'),
    imageId: uuid('image_id').references(() => fileMetadata.id, { onDelete: 'set null' }),
    visibility: faceVisibilityEnum('visibility').notNull().default('public'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // 「自分の投稿」の検索用（WHERE user_id = ?）
    index('idx_faces_user_id').on(table.userId),
  ]
);

export type FaceRow = typeof faces.$inferSelect;
export type NewFaceRow = typeof faces.$inferInsert;

// NOTE: facesRelations（faces → seeds の逆方向リレーション）は循環インポートを
// 避けるため seed/infra/db/schema.ts 側の seedsRelations で定義する。
// seeds が faces に依存しているため、faces 側から seeds をインポートできない。
