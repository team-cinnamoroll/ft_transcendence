import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from '../../../users/infra/db/schema';
import { fileMetadata } from '../../../file-storage/infra/db/schema';

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  badge: text('badge'),
  createdAt: timestamp('created_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
  avatarFileId: uuid('avatar_file_id')
    .unique()
    .references(() => fileMetadata.id, { onDelete: 'set null' }),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export type UserProfileRow = typeof userProfiles.$inferSelect;
export type NewUserProfileRow = typeof userProfiles.$inferInsert;
