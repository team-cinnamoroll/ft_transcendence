import { eq } from 'drizzle-orm';

import { UserId } from '@tracen/contracts';
import { UserProfileEntity, UserProfileEntitySchema } from '../../domain/user-profile.entity';
import { type UserProfileRepositorySpec } from '../../domain/user-profile.repository';
import type { TracenDb } from '../../../../shared/infra/db/client';
import { userProfiles, type UserProfileRow, type NewUserProfileRow } from './schema';
import { NotFoundError, ValidationError } from '../../../../shared/errors/global.error';
import { makeSafeInfraResult } from '../../../../shared/utils/validation';

function mapUserProfile(row: UserProfileRow): UserProfileEntity {
  return makeSafeInfraResult(UserProfileEntitySchema, {
    id: row.id,
    userId: row.userId,
    name: row.name,
    badge: row.badge,
    avatarFileId: row.avatarFileId,
  });
}

class UserProfileDBRepositoryImpl implements UserProfileRepositorySpec {
  constructor(private readonly db: TracenDb) {}

  async upsertUserProfile(userProfile: UserProfileEntity): Promise<UserProfileEntity> {
    const newRow: NewUserProfileRow = {
      id: userProfile.id,
      userId: userProfile.userId,
      name: userProfile.name,
      badge: userProfile.badge,
      avatarFileId: userProfile.avatarFileId,
    };

    try {
      const rows = await this.db
        .insert(userProfiles)
        .values(newRow)
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            name: newRow.name,
            badge: newRow.badge,
            avatarFileId: newRow.avatarFileId,
            updatedAt: new Date(),
          },
        })
        .returning();

      return mapUserProfile(rows[0]);
    } catch (error: unknown) {
      // drizzle-ormのエラーは、通常、Errorオブジェクトのcauseプロパティにデータベースエラーが格納される
      // causeに格納されるpostgresqlのエラーコードを確認して、ユニーク制約違反や外部キー制約違反などのケースをハンドリングする
      const dbError = error instanceof Error ? error.cause : undefined;
      if (dbError && typeof dbError === 'object' && 'code' in dbError) {
        const errObj = dbError as Record<string, unknown>;
        // ユニーク制約違反
        if (errObj.code === '23505') {
          if (errObj.constraint_name === 'user_profiles_avatar_file_id_unique') {
            throw new ValidationError(
              `Avatar file with ID ${userProfile.avatarFileId} is already in use.`
            );
          }
          if (errObj.constraint_name === 'user_profiles_user_id_unique') {
            throw new ValidationError(`User with ID ${userProfile.userId} already has a profile.`);
          }
        }
        // 外部キー制約違反
        if (errObj.code === '23503') {
          if (errObj.constraint_name === 'user_profiles_avatar_file_id_file_metadata_id_fk') {
            throw new NotFoundError(`Avatar file with ID ${userProfile.avatarFileId} not found.`);
          }
          if (errObj.constraint_name === 'user_profiles_user_id_users_id_fk') {
            throw new NotFoundError(`User with ID ${userProfile.userId} not found.`);
          }
        }
      }
      throw error; // その他のエラーはそのままスロー
    }
  }

  async getUserProfile(userId: UserId): Promise<UserProfileEntity | null> {
    const rows = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (rows.length === 0) return null;
    return mapUserProfile(rows[0]);
  }
}

export function createDrizzleUserProfileRepository(db: TracenDb): UserProfileRepositorySpec {
  return new UserProfileDBRepositoryImpl(db);
}
