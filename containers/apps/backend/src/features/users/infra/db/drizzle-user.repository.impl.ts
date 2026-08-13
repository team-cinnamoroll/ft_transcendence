import { eq } from 'drizzle-orm';

import type { UserId, Email } from '@tracen/contracts';
import { type UserEntity, UserEntitySchema } from '../../domain/users.entity';
import type { UserRepositorySpec } from '../../domain/users.repository';

import type { TracenDb } from '../../../../shared/infra/db/client';
import { users, type UserRow, type NewUserRow } from './schema';
import { ValidationError } from '../../../../shared/errors/global.error';
import { makeSafeInfraResult } from '../../../../shared/utils/validation';

function mapUser(row: UserRow): UserEntity {
  return makeSafeInfraResult(UserEntitySchema, {
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
    const newRow: NewUserRow = {
      id: data.id,
      email: data.email,
      name: data.name,
      passwordHash: data.password_hash,
    };
    try {
      const rows = await this.db.insert(users).values(newRow).returning();

      return mapUser(rows[0]);
    } catch (error: unknown) {
      // drizzle-ormのエラーは、通常、Errorオブジェクトのcauseプロパティにデータベースエラーが格納される
      // causeに格納されるpostgresqlのエラーコードを確認して、ユニーク制約違反や外部キー制約違反などのケースをハンドリングする
      const dbError = error instanceof Error ? error.cause : undefined;
      if (dbError && typeof dbError === 'object' && 'code' in dbError) {
        const errObj = dbError as Record<string, unknown>;
        // ユニーク制約違反
        if (errObj.code === '23505') {
          if (errObj.constraint_name === 'users_email_unique') {
            throw new ValidationError(`Email "${data.email}" is already in use.`);
          }
          if (errObj.constraint_name === 'users_pkey') {
            throw new ValidationError(`User with ID "${data.id}" already exists.`);
          }
        }
        // UUIDなどのフォーマット異常 (22P02)
        if (errObj.code === '22P02') {
          throw new ValidationError(`Invalid data format provided for User.`); // ※ BadRequestError等推奨
        }

        // NOT NULL 制約違反 (23502) - 型やZodをすり抜けた場合
        if (errObj.code === '23502') {
          throw new ValidationError(`Missing required field: ${errObj.column_name}`); // どのカラムが空だったか拾えます
        }
      }
      throw error; // 上記で処理されなかったエラーは再スロー
    }
  }

  async update(data: UserEntity): Promise<UserEntity> {
    const updatedRow: Partial<NewUserRow> = {
      email: data.email,
      name: data.name,
      passwordHash: data.password_hash,
    };

    try {
      const rows = await this.db
        .update(users)
        .set(updatedRow)
        .where(eq(users.id, data.id))
        .returning();

      if (rows.length === 0) {
        throw new ValidationError(`User with ID "${data.id}" not found.`);
      }

      return mapUser(rows[0]);
    } catch (error: unknown) {
      const dbError = error instanceof Error ? error.cause : undefined;
      if (dbError && typeof dbError === 'object' && 'code' in dbError) {
        const errObj = dbError as Record<string, unknown>;
        // ユニーク制約違反
        if (errObj.code === '23505') {
          if (errObj.constraint_name === 'users_email_unique') {
            throw new ValidationError(`Email "${data.email}" is already in use.`);
          }
        }
        // UUIDなどのフォーマット異常 (22P02)
        if (errObj.code === '22P02') {
          throw new ValidationError(`Invalid data format provided for User.`);
        }
        // NOT NULL 制約違反 (23502)
        if (errObj.code === '23502') {
          throw new ValidationError(`Missing required field: ${errObj.column_name}`);
        }
      }
      throw error; // 上記で処理されなかったエラーは再スロー
    }
  }
}

export function createDrizzleUserRepository(db: TracenDb): UserRepositorySpec {
  return new UserDBRepositoryImpl(db);
}
