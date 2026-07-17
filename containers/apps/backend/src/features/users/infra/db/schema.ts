import { pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    // RBAC / 利用制限。値は @tracen/contracts の UserRoleSchema / UserStatusSchema で検証する。
    // DB レベルの enum 制約は将来の hardening とし、既存スタイル（text + default）に揃える。
    role: text('role').notNull().default('user'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: false, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)]
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
