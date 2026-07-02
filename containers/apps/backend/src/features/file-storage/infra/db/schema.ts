import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * すべてのファイル・画像のメタデータを一元管理するテーブル
 * (LocalFileSystem / SeaweedFS / AWS S3 のどれを使っても変更不要)
 */
export const fileMetadata = pgTable('file_metadata', {
  // 一意の識別子（ビジネスドメインからはこのIDで参照される）
  id: uuid('id').primaryKey().defaultRandom(),

  // ファイルの所有者ID（認可チェック用：users.id等と紐づくが、クリーンさのために物理外部キーは外すのが一般的）
  ownerId: uuid('owner_id').notNull(),

  // ストレージの区分（ローカルならルートフォルダ名、S3ならバケット名：例 'public-bucket', 'private-bucket'）
  bucket: varchar('bucket', { length: 63 }).notNull(),

  // ストレージ内の相対パス・オブジェクトキー（例: 'avatars/user-123.png', 'posts/abcd-efgh.jpg'）
  // 物理ディスクやS3内で一意にするため unique 制約
  storageKey: varchar('storage_key', { length: 512 }).notNull().unique(),

  // アップロードされた元のファイル名（ダウンロード時のデフォルト名等に使用：例: 'my_photo.png'）
  fileName: varchar('file_name', { length: 255 }).notNull(),

  // HTTPヘッダーの Content-Type にそのまま使用する値（例: 'image/png', 'application/pdf'）
  mimeType: varchar('mime_type', { length: 100 }).notNull(),

  // HTTPヘッダーの Content-Length に使用するバイトサイズ（例: 102452）
  fileSize: integer('file_size').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type FileMetadataRow = typeof fileMetadata.$inferSelect;
export type NewFileMetadataRow = typeof fileMetadata.$inferInsert;
