import { eq } from 'drizzle-orm';

import type { UserId, Email } from '@tracen/contracts';
import { type UserEntity, UserEntitySchema } from '../../domain/users.entity';
import type { UserRepositorySpec } from '../../domain/users.repository';

import type { TracenDb } from '../../../../shared/infra/db/client';
import { users, type UserRow } from './schema';

function mapUser(row: UserRow): UserEntity {
  return UserEntitySchema.parse({
    id: row.id,
    email: row.email,
    name: row.name,
    password_hash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
  });
}

class UserDBRepositoryImpl implements UserRepositorySpec {
  constructor(private readonly db: TracenDb) {}

  async findById(id: UserId): Promise<UserEntity | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    if (rows.length === 0) return null;
    return mapUser(rows[0]);
  }

  async findByEmail(email: Email): Promise<UserEntity | null> {
    const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    if (rows.length === 0) return null;
    return mapUser(rows[0]);
  }

  async deleteById(id: UserId): Promise<boolean> {
    const rows = await this.db.delete(users).where(eq(users.id, id)).returning({ id: users.id });

    return rows.length > 0;
  }

  async create(data: UserEntity): Promise<UserEntity> {
    const rows = await this.db
      .insert(users)
      .values({
        id: data.id,
        email: data.email,
        name: data.name,
        passwordHash: data.password_hash,
      })
      .returning();

    return mapUser(rows[0]);
  }
}

export function createDrizzleUserRepository(db: TracenDb): UserRepositorySpec {
  return new UserDBRepositoryImpl(db);
}
