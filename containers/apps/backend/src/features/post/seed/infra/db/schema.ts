import {
  pgTable,
  uuid,
  timestamp,
  integer,
  index,
  text,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { users } from '../../../../users/infra/db/schema'; // 既存のusersテーブル
import { faces } from '../../../face/infra/db/schema'; // 既存のfacesテーブル
import { fileMetadata } from '../../../../file-storage/infra/db/schema'; // 既存のfileMetadataテーブル

export const seeds = pgTable(
  'seeds',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // 投稿者
    faceId: uuid('face_id')
      .notNull()
      .references(() => faces.id, { onDelete: 'cascade' }), // 投稿先のface
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // 1. 「自分の投稿」の検索用（WHERE user_id = ?）
    index('idx_seeds_user_id').on(table.userId),
    // 2. 「faceに紐づく投稿」の検索用（WHERE face_id = ?）
    index('idx_seeds_face_id').on(table.faceId),
  ]
);

export const seedImages = pgTable(
  'seed_images',
  {
    seedId: uuid('seed_id')
      .notNull()
      .references(() => seeds.id, { onDelete: 'cascade' }), // 投稿ID
    imageId: uuid('image_id')
      .notNull()
      .references(() => fileMetadata.id, { onDelete: 'cascade' }), // 画像ID
    displayOrder: integer('display_order').notNull(), // 画像の順序を示すインデックス
  },
  (table) => [
    // 複合主キー（重複登録防止 & seed_id 単体インデックスの役割も兼ねる）
    primaryKey({ columns: [table.seedId, table.imageId] }),
    // 2. 「画像から紐づく投稿を探す」逆引き用インデックス（WHERE image_id = ?）
    index('idx_seed_images_image_id').on(table.imageId),
    // 同一投稿内で同じ順序番号が重複しないためのユニーク制約
    uniqueIndex('uq_seed_images_seed_id_order').on(table.seedId, table.displayOrder),
  ]
);

type SeedRow = typeof seeds.$inferSelect;
type NewSeedRow = typeof seeds.$inferInsert;

type SeedImageRow = typeof seedImages.$inferSelect;
type NewSeedImageRow = typeof seedImages.$inferInsert;

export const seedsRelations = relations(seeds, ({ one, many }) => ({
  // faces への逆リレーション（faces 側からの循環インポート回避のためここで定義）
  face: one(faces, {
    fields: [seeds.faceId],
    references: [faces.id],
  }),
  // seedImages への逆リレーション
  seedImages: many(seedImages),
}));

export const seedImagesRelations = relations(seedImages, ({ one }) => ({
  seed: one(seeds, {
    fields: [seedImages.seedId],
    references: [seeds.id],
  }),
}));

export type SeedRowWithImages = SeedRow & {
  seedImages: SeedImageRow[];
};

export type NewSeedRowWithImages = NewSeedRow & {
  seedImages: NewSeedImageRow[];
};
