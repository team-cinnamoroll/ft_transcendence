import { inArray, eq } from 'drizzle-orm';
import type { SeedRepositorySpec } from '../../domain/seed.repository';
import type { TracenDb } from '../../../../../shared/infra/db/client';

import type { SeedId, UserId } from '@tracen/contracts';
import { type SeedEntity, SeedEntitySchema } from '../../domain/seed.entity';
import { seeds, seedImages, type SeedRowWithImages } from '../db/schema';
import { NotFoundError } from '../../../../../shared/errors/global.error';
import { makeSafeInfraResult } from '../../../../../shared/utils/validation';

class DrizzleSeedRepositoryImpl implements SeedRepositorySpec {
  constructor(private readonly db: TracenDb) {}

  private mapSeedRowToEntity(row: SeedRowWithImages): SeedEntity {
    return makeSafeInfraResult(SeedEntitySchema, {
      id: row.id,
      faceId: row.faceId,
      userId: row.userId,
      body: row.body,
      imageIds: row.seedImages
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((img) => img.imageId),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  async getSeedById(seedId: SeedId): Promise<SeedEntity | null> {
    const seedRow = await this.db.query.seeds.findFirst({
      where: eq(seeds.id, seedId),
      with: {
        seedImages: true,
      },
    });
    if (!seedRow) {
      return null;
    }
    return this.mapSeedRowToEntity(seedRow);
  }

  async getSeedsByIds(seedIds: SeedId[]): Promise<SeedEntity[]> {
    if (seedIds.length === 0) return [];
    const seedRows = await this.db.query.seeds.findMany({
      where: inArray(seeds.id, seedIds),
      with: {
        seedImages: true,
      },
    });
    return seedRows.map((row) => this.mapSeedRowToEntity(row));
  }

  async getSeedsByUserId(userId: UserId): Promise<SeedEntity[]> {
    const seedRows = await this.db.query.seeds.findMany({
      where: eq(seeds.userId, userId),
      with: {
        seedImages: true,
      },
    });
    return seedRows.map((row) => this.mapSeedRowToEntity(row));
  }

  async createSeed(seed: SeedEntity): Promise<SeedEntity> {
    const createdAt = new Date(seed.createdAt);
    const newSeedImages = seed.imageIds.map((imageId, index) => ({
      seedId: seed.id,
      imageId: imageId,
      displayOrder: index,
    }));

    try {
      await this.db.transaction(async (tx) => {
        await tx
          .insert(seeds)
          .values({
            id: seed.id,
            faceId: seed.faceId,
            userId: seed.userId,
            body: seed.body,
            createdAt: createdAt,
            updatedAt: createdAt,
          })
          .execute();

        // 画像が存在する場合のみ INSERT（空配列は drizzle でエラーになるため必須）
        if (newSeedImages.length > 0) {
          await tx.insert(seedImages).values(newSeedImages).execute();
        }
      });
    } catch (error) {
      console.error('Error creating seed in database:', error);
      throw error;
    }

    // DB から実際に保存されたデータを取得して返却（DB デフォルト値を正確に反映するため）
    const storedRow = await this.db.query.seeds.findFirst({
      where: eq(seeds.id, seed.id),
      with: { seedImages: true },
    });
    if (!storedRow) {
      throw new Error(`Failed to retrieve created seed with ID ${seed.id}`);
    }
    return this.mapSeedRowToEntity(storedRow);
  }

  async updateSeed(modifiedSeed: SeedEntity): Promise<SeedEntity> {
    const newSeedImages = modifiedSeed.imageIds.map((imageId, index) => ({
      seedId: modifiedSeed.id,
      imageId: imageId,
      displayOrder: index,
    }));

    await this.db.transaction(async (tx) => {
      // createdAt は不変なため SET に含めない
      await tx
        .update(seeds)
        .set({
          faceId: modifiedSeed.faceId,
          userId: modifiedSeed.userId,
          body: modifiedSeed.body,
          updatedAt: new Date(modifiedSeed.updatedAt),
        })
        .where(eq(seeds.id, modifiedSeed.id))
        .execute();

      // 既存の seedImages を削除してから新規挿入（差分更新より確実）
      await tx.delete(seedImages).where(eq(seedImages.seedId, modifiedSeed.id)).execute();

      // 画像が存在する場合のみ INSERT
      if (newSeedImages.length > 0) {
        await tx.insert(seedImages).values(newSeedImages).execute();
      }
    });

    // DB から実際に更新されたデータを取得して返却（$onUpdate 等のDB側処理を正確に反映するため）
    const updatedRow = await this.db.query.seeds.findFirst({
      where: eq(seeds.id, modifiedSeed.id),
      with: { seedImages: true },
    });
    if (!updatedRow) {
      throw new NotFoundError(`Seed with ID ${modifiedSeed.id} not found`);
    }
    return this.mapSeedRowToEntity(updatedRow);
  }

  async deleteSeedById(seedId: SeedId): Promise<void> {
    const rows = await this.db.delete(seeds).where(eq(seeds.id, seedId)).returning();
    if (rows.length === 0) {
      throw new NotFoundError(`Seed with ID ${seedId} not found`);
    }
    return;
  }
}

export function createDrizzleSeedRepository(db: TracenDb): SeedRepositorySpec {
  return new DrizzleSeedRepositoryImpl(db);
}
