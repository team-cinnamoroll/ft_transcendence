import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { CreateUserInput, User, UserId } from '@tracen/contracts';

import type { UserRepositorySpec } from '../../features/auth/user.repository';
import type { TracenDb } from '../db/client';
import { users, type UserRow } from '../db/schema';

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  };
}

export class UserDBRepositoryImpl implements UserRepositorySpec {
  constructor(private readonly db: TracenDb) {}

  async findById(id: UserId): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    if (rows.length === 0) return null;
    return mapUser(rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    if (rows.length === 0) return null;
    return mapUser(rows[0]);
  }

  async create(data: CreateUserInput): Promise<User> {
    const id = crypto.randomUUID();

    const rows = await this.db
      .insert(users)
      .values({
        id,
        email: data.email,
        name: data.name,
      })
      .returning();

    return mapUser(rows[0]);
  }
}

export function createDrizzleUserRepository(db: TracenDb): UserRepositorySpec {
  return new UserDBRepositoryImpl(db);
}
