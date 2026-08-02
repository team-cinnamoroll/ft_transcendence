import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import type { SeedQueryServiceSpec } from '../../domain/seed.query-service';
import type { TracenDb } from '../../../../../shared/infra/db/client';
import { SeedEntitySchema, type SeedEntityList } from '../../domain/seed.entity';
import { seeds, seedImages } from '../db/schema';
import { makeSafeInfraResult } from '../../../../../shared/utils/validation';
import type { QuerySeedRequest } from '@tracen/contracts';

class DrizzleSeedQueryServiceImpl implements SeedQueryServiceSpec {
  constructor(private readonly db: TracenDb) {}

  async getSeedList(query: QuerySeedRequest): Promise<SeedEntityList> {
    const limit = query.limit ?? 20;
    const order = query.order ?? 'desc';

    // WHERE 条件を動的に構築
    const whereConditions: ReturnType<typeof eq>[] = [];

    if (query.faceId) {
      whereConditions.push(eq(seeds.faceId, query.faceId));
    }

    if (query.userId) {
      whereConditions.push(eq(seeds.userId, query.userId));
    }

    if (query.q) {
      const keyword = `%${query.q}%`;
      whereConditions.push(ilike(seeds.body, keyword) as ReturnType<typeof eq>);
    }

    if (query.fromDate) {
      whereConditions.push(gte(seeds.createdAt, new Date(query.fromDate)) as ReturnType<typeof eq>);
    }

    if (query.toDate) {
      whereConditions.push(lte(seeds.createdAt, new Date(query.toDate)) as ReturnType<typeof eq>);
    }

    // カーソルページネーション
    // cursor は前ページ最後の seed.id で、createdAt の方向でページングする
    if (query.cursor) {
      const cursorRows = await this.db
        .select({ createdAt: seeds.createdAt, id: seeds.id })
        .from(seeds)
        .where(eq(seeds.id, query.cursor))
        .limit(1);

      if (cursorRows.length > 0) {
        const { createdAt: cursorCreatedAt, id: cursorId } = cursorRows[0];

        if (order === 'desc') {
          // desc 順: カーソルより古い（createdAt が小さい）もの、
          // 同じ createdAt の場合は id でタイブレーク
          whereConditions.push(
            or(
              sql`${seeds.createdAt} < ${cursorCreatedAt.toISOString()}::timestamptz`,
              and(
                sql`${seeds.createdAt} = ${cursorCreatedAt.toISOString()}::timestamptz`,
                sql`${seeds.id} > ${cursorId}`
              )
            ) as ReturnType<typeof eq>
          );
        } else {
          // asc 順: カーソルより新しい（createdAt が大きい）もの
          whereConditions.push(
            or(
              sql`${seeds.createdAt} > ${cursorCreatedAt.toISOString()}::timestamptz`,
              and(
                sql`${seeds.createdAt} = ${cursorCreatedAt.toISOString()}::timestamptz`,
                sql`${seeds.id} > ${cursorId}`
              )
            ) as ReturnType<typeof eq>
          );
        }
      }
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // ソート順の決定（日付のみ対応、仕様通り）
    const orderByClauses =
      order === 'desc'
        ? [desc(seeds.createdAt), asc(seeds.id)]
        : [asc(seeds.createdAt), asc(seeds.id)];

    // seeds と seedImages を一緒に取得
    const seedRows = await this.db.query.seeds.findMany({
      where: whereClause,
      with: {
        seedImages: {
          orderBy: asc(seedImages.displayOrder),
        },
      },
      orderBy: orderByClauses,
      limit: limit + 1, // hasNext 判定のため +1 件取得
    });

    const hasNext = seedRows.length > limit;
    const items = hasNext ? seedRows.slice(0, limit) : seedRows;
    const nextCursor = hasNext ? items[items.length - 1].id : null;

    const seedEntities = items.map((row) =>
      makeSafeInfraResult(SeedEntitySchema, {
        id: row.id,
        faceId: row.faceId,
        userId: row.userId,
        body: row.body,
        imageIds: row.seedImages.map((img) => img.imageId),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })
    );

    return {
      seedEntities,
      nextCursor,
    };
  }
}

export function createDrizzleSeedQueryService(db: TracenDb): SeedQueryServiceSpec {
  return new DrizzleSeedQueryServiceImpl(db);
}
