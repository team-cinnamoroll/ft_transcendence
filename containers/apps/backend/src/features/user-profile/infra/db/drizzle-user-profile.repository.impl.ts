import { eq } from 'drizzle-orm';

import { UserId } from '@tracen/contracts';
import { UserProfileEntity } from '../../domain/user-profile.entity';
import { type UserProfileRepositorySpec } from '../../domain/user-profile.repository';
import type { TracenDb } from '../../../../shared/infra/db/client';
import { userProfiles, type UserProfileRow, type NewUserProfileRow } from './schema';

function mapUserProfile(row: UserProfileRow): UserProfileEntity {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    badge: row.badge ?? undefined,
    avatarFileId: row.avatarFileId ?? undefined,
  };
}

class UserProfileDBRepositoryImpl implements UserProfileRepositorySpec {
  constructor(private readonly db: TracenDb) {}

  async upsertUserProfile(userProfile: UserProfileEntity): Promise<UserProfileEntity> {
    const newRow: NewUserProfileRow = {
      id: userProfile.id,
      userId: userProfile.userId,
      name: userProfile.name,
      badge: userProfile.badge ?? null,
      avatarFileId: userProfile.avatarFileId ?? null,
    };

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
