import { inArray, eq } from 'drizzle-orm';
import type { FaceRepositorySpec } from '../../domain/face.repository';
import type { TracenDb } from '../../../../../shared/infra/db/client';

import type { FaceId, UserId } from '@tracen/contracts';
import { type FaceEntity, FaceEntitySchema } from '../../domain/face.entity';
import { faces, type FaceRow, type NewFaceRow } from '../db/schema';
import { NotFoundError } from '../../../../../shared/errors/global.error';
import { makeSafeInfraResult } from '../../../../../shared/utils/validation';

class DrizzleFaceRepositoryImpl implements FaceRepositorySpec {
  constructor(private readonly db: TracenDb) {}

  private mapFaceRowToEntity(row: FaceRow): FaceEntity {
    return makeSafeInfraResult(FaceEntitySchema, {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      emoji: row.emoji,
      imageId: row.imageId,
      visibility: row.visibility,
    });
  }

  async getFaceById(faceId: FaceId): Promise<FaceEntity | null> {
    const row = await this.db.select().from(faces).where(eq(faces.id, faceId));
    if (row.length === 0) return null;
    return this.mapFaceRowToEntity(row[0]);
  }

  async getFacesByIds(faceIds: FaceId[]): Promise<FaceEntity[]> {
    if (faceIds.length === 0) return [];
    const rows = await this.db.select().from(faces).where(inArray(faces.id, faceIds));
    const faceMap = new Map(rows.map((row) => [row.id, this.mapFaceRowToEntity(row)]));
    return faceIds
      .map((id) => faceMap.get(id))
      .filter((face): face is FaceEntity => face !== undefined);
  }

  async getFacesByUserId(userId: UserId): Promise<FaceEntity[]> {
    const rows = await this.db.select().from(faces).where(eq(faces.userId, userId));
    return rows.map((row) => this.mapFaceRowToEntity(row));
  }

  async createFace(face: FaceEntity): Promise<FaceEntity> {
    const newRow: NewFaceRow = {
      id: face.id,
      userId: face.userId,
      name: face.name,
      description: face.description,
      emoji: face.emoji,
      imageId: face.imageId,
      visibility: face.visibility,
    };
    try {
      const rows = await this.db.insert(faces).values(newRow).returning();
      return this.mapFaceRowToEntity(rows[0]);
    } catch (error: unknown) {
      const dbError = error instanceof Error ? error.cause : undefined;
      if (dbError && typeof dbError === 'object' && 'code' in dbError) {
        const errObj = dbError as Record<string, unknown>;
        // 外部キー制約違反
        if (errObj.code === '23503') {
          if (errObj.constraint_name === 'faces_user_id_users_id_fk') {
            throw new NotFoundError(`User with ID ${face.userId} does not exist.`);
          }
          if (errObj.constraint_name === 'faces_image_id_file_metadata_id_fk') {
            throw new NotFoundError(`File with ID ${face.imageId} does not exist.`);
          }
        }
      }
      throw error;
    }
  }

  async updateFace(face: FaceEntity): Promise<FaceEntity> {
    try {
      const rows = await this.db
        .update(faces)
        .set({
          name: face.name,
          description: face.description,
          emoji: face.emoji,
          imageId: face.imageId,
          visibility: face.visibility,
          updatedAt: new Date(),
        })
        .where(eq(faces.id, face.id))
        .returning();

      if (rows.length === 0) {
        throw new NotFoundError(`Face with ID ${face.id} not found.`);
      }

      return this.mapFaceRowToEntity(rows[0]);
    } catch (error: unknown) {
      const dbError = error instanceof Error ? error.cause : undefined;
      if (dbError && typeof dbError === 'object' && 'code' in dbError) {
        const errObj = dbError as Record<string, unknown>;
        // 外部キー制約違反
        if (errObj.code === '23503') {
          if (errObj.constraint_name === 'faces_user_id_users_id_fk') {
            throw new NotFoundError(`User with ID ${face.userId} does not exist.`);
          }
          if (errObj.constraint_name === 'faces_image_id_file_metadata_id_fk') {
            throw new NotFoundError(`File with ID ${face.imageId} does not exist.`);
          }
        }
      }
      throw error;
    }
  }

  async deleteFaceById(faceId: FaceId): Promise<void> {
    const rows = await this.db.delete(faces).where(eq(faces.id, faceId)).returning();
    if (rows.length === 0) {
      throw new NotFoundError(`Face with ID ${faceId} not found.`);
    }
    return;
  }
}

export function createDrizzleFaceRepository(db: TracenDb): FaceRepositorySpec {
  return new DrizzleFaceRepositoryImpl(db);
}
