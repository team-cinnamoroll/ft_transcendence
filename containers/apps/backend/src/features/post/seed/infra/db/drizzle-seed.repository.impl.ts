import { inArray, eq } from 'drizzle-orm';
import type { SeedRepositorySpec } from '../../domain/seed.repository';
import type { TracenDb } from '../../../../../shared/infra/db/client';

import type { SeedId, UserId } from '@tracen/contracts';
import { type SeedEntity, SeedEntitySchema } from '../../domain/seed.entity';
import { seeds, seedImages } from '../db/schema';
import { NotFoundError } from '../../../../../shared/errors/global.error';
import { makeSafeInfraResult } from '../../../../../shared/utils/validation';

// seeds テーブルの行型
type SeedRowRaw = typeof seeds.$inferSelect;
// seed_images テーブルの行型
type SeedImageRowRaw = typeof seedImages.$inferSelect;

/** DB から取得した seeds + seedImages をエンティティにマップする */
function mapRowsToEntity(seedRow: SeedRowRaw, imageRows: SeedImageRowRaw[]): SeedEntity {
  const sortedImages = [...imageRows].sort((a, b) => a.displayOrder - b.displayOrder);
  return makeSafeInfraResult(SeedEntitySchema, {
    id: seedRow.id,
    faceId: seedRow.faceId,
    userId: seedRow.userId,
    body: seedRow.body,
    imageIds: sortedImages.map((img) => img.imageId),
    createdAt: seedRow.createdAt.toISOString(),
    updatedAt: seedRow.updatedAt.toISOString(),
  });
}

/** seedIds をキーにして seed_images をバルク取得し、seedId ごとにグループ化する */
async function fetchImagesBySeeds(
  db: TracenDb,
  seedIds: SeedId[]
): Promise<Map<SeedId, SeedImageRowRaw[]>> {
  if (seedIds.length === 0) return new Map();
  const imgRows = await db.select().from(seedImages).where(inArray(seedImages.seedId, seedIds));
  const map = new Map<SeedId, SeedImageRowRaw[]>();
  for (const img of imgRows) {
    if (!map.has(img.seedId)) map.set(img.seedId, []);
    map.get(img.seedId)!.push(img);
  }
  return map;
}

class DrizzleSeedRepositoryImpl implements SeedRepositorySpec {
  constructor(private readonly db: TracenDb) {}

  async getSeedById(seedId: SeedId): Promise<SeedEntity | null> {
    const rows = await this.db.select().from(seeds).where(eq(seeds.id, seedId));
    if (rows.length === 0) return null;
    const imgMap = await fetchImagesBySeeds(this.db, [seedId]);
    return mapRowsToEntity(rows[0], imgMap.get(seedId) ?? []);
  }

  async getSeedsByIds(seedIds: SeedId[]): Promise<SeedEntity[]> {
    if (seedIds.length === 0) return [];
    const seedRows = await this.db.select().from(seeds).where(inArray(seeds.id, seedIds));
    const imgMap = await fetchImagesBySeeds(this.db, seedIds);
    const seedMap = new Map(seedRows.map((r) => [r.id, r]));
    // 引数の順序を保持
    return seedIds
      .map((id) => seedMap.get(id))
      .filter((r): r is SeedRowRaw => r !== undefined)
      .map((r) => mapRowsToEntity(r, imgMap.get(r.id) ?? []));
  }

  async getSeedsByUserId(userId: UserId): Promise<SeedEntity[]> {
    const seedRows = await this.db.select().from(seeds).where(eq(seeds.userId, userId));
    const ids = seedRows.map((r) => r.id);
    const imgMap = await fetchImagesBySeeds(this.db, ids);
    return seedRows.map((r) => mapRowsToEntity(r, imgMap.get(r.id) ?? []));
  }

  async createSeed(seed: SeedEntity): Promise<SeedEntity> {
    const createdAt = new Date(seed.createdAt);
    const newSeedImages = seed.imageIds.map((imageId, index) => ({
      seedId: seed.id,
      imageId,
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
            createdAt,
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
    const storedRows = await this.db.select().from(seeds).where(eq(seeds.id, seed.id));
    if (storedRows.length === 0) {
      throw new Error(`Failed to retrieve created seed with ID ${seed.id}`);
    }
    const imgMap = await fetchImagesBySeeds(this.db, [seed.id]);
    return mapRowsToEntity(storedRows[0], imgMap.get(seed.id) ?? []);
  }

  async updateSeed(modifiedSeed: SeedEntity): Promise<SeedEntity> {
    const newSeedImages = modifiedSeed.imageIds.map((imageId, index) => ({
      seedId: modifiedSeed.id,
      imageId,
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
    const updatedRows = await this.db.select().from(seeds).where(eq(seeds.id, modifiedSeed.id));
    if (updatedRows.length === 0) {
      throw new NotFoundError(`Seed with ID ${modifiedSeed.id} not found`);
    }
    const imgMap = await fetchImagesBySeeds(this.db, [modifiedSeed.id]);
    return mapRowsToEntity(updatedRows[0], imgMap.get(modifiedSeed.id) ?? []);
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
