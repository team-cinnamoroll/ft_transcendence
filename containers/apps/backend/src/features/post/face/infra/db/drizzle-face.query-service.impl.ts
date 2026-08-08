import { and, count, desc, asc, eq, gt, ilike, max, or, sql, SQL } from 'drizzle-orm';
import type { FaceQueryServiceSpec } from '../../domain/face.query-service';
import type { TracenDb } from '../../../../../shared/infra/db/client';
import {
  FaceEntitySummarySchema,
  type FaceEntitySummaryList,
  type FaceEntitySummary,
} from '../../domain/face.entity';
import { faces } from '../db/schema';
import { seeds } from '../../../seed/infra/db/schema';
import { makeSafeInfraResult } from '../../../../../shared/utils/validation';
import type { FaceId, QueryFaceRequest } from '@tracen/contracts';
import { InternalValidationError } from '../../../../../shared/errors/global.error';

class DrizzleFaceQueryServiceImpl implements FaceQueryServiceSpec {
  constructor(private readonly db: TracenDb) {}

  async getFaceSummaryList(query: QueryFaceRequest): Promise<FaceEntitySummaryList> {
    const limit = query.limit ?? 20;
    const order = query.order ?? 'desc';
    const sortBy = query.sortBy ?? 'lastpostedAt';

    // WHERE 条件を構築（GROUP BY 前）
    const whereConditions: SQL[] = [];

    if (query.userId) {
      whereConditions.push(eq(faces.userId, query.userId));
    }

    if (query.q) {
      const keyword = `%${query.q}%`;
      whereConditions.push(
        or(
          ilike(faces.name, keyword),
          ilike(faces.description, keyword),
          ilike(faces.emoji, keyword)
        ) as SQL
      );
    }

    // カーソル位置の集計値を先に取得し、HAVING 句のページネーション条件を構築
    let havingCondition: SQL | undefined = undefined;
    if (query.cursor) {
      const cursorRows = await this.db
        .select({
          id: faces.id,
          lastPostedAt: max(seeds.createdAt).as('lastPostedAt'),
          numberOfPosts: count(seeds.id).as('numberOfPosts'),
        })
        .from(faces)
        .leftJoin(seeds, eq(seeds.faceId, faces.id))
        .where(eq(faces.id, query.cursor))
        .groupBy(faces.id);

      if (cursorRows.length > 0) {
        const cursorRow = cursorRows[0];
        const cursorLastPostedAt = cursorRow.lastPostedAt;
        const cursorCount = cursorRow.numberOfPosts;

        if (sortBy === 'lastpostedAt') {
          if (order === 'desc') {
            // desc: カーソルの lastPostedAt より古いもの、または lastPostedAt が null のもの
            havingCondition =
              cursorLastPostedAt !== null
                ? (or(
                    sql`MAX(${seeds.createdAt}) < ${cursorLastPostedAt}`,
                    sql`MAX(${seeds.createdAt}) IS NULL`
                  ) as SQL)
                : (gt(faces.id, query.cursor) as SQL);
          } else {
            // asc: カーソルの lastPostedAt より新しいもの
            havingCondition =
              cursorLastPostedAt !== null
                ? (or(
                    sql`MAX(${seeds.createdAt}) > ${cursorLastPostedAt}`,
                    and(
                      sql`MAX(${seeds.createdAt}) = ${cursorLastPostedAt}`,
                      gt(faces.id, query.cursor)
                    )
                  ) as SQL)
                : (gt(faces.id, query.cursor) as SQL);
          }
        } else {
          // seedsCount ソート
          if (order === 'desc') {
            havingCondition = or(
              sql`COUNT(${seeds.id}) < ${cursorCount}`,
              and(sql`COUNT(${seeds.id}) = ${cursorCount}`, gt(faces.id, query.cursor))
            ) as SQL;
          } else {
            havingCondition = or(
              sql`COUNT(${seeds.id}) > ${cursorCount}`,
              and(sql`COUNT(${seeds.id}) = ${cursorCount}`, gt(faces.id, query.cursor))
            ) as SQL;
          }
        }
      }
    }

    // ソート順の決定
    const orderByClauses =
      sortBy === 'lastpostedAt'
        ? order === 'desc'
          ? [desc(max(seeds.createdAt)), asc(faces.id)]
          : [asc(max(seeds.createdAt)), asc(faces.id)]
        : order === 'desc'
          ? [desc(count(seeds.id)), asc(faces.id)]
          : [asc(count(seeds.id)), asc(faces.id)];

    // WHERE 条件を合成
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // メインクエリ: faces × seeds を LEFT JOIN して集計値を計算
    const rows = await this.db
      .select({
        id: faces.id,
        userId: faces.userId,
        name: faces.name,
        emoji: faces.emoji,
        description: faces.description,
        imageId: faces.imageId,
        visibility: faces.visibility,
        lastPostedAt: max(seeds.createdAt).as('lastPostedAt'),
        numberOfPosts: count(seeds.id).as('numberOfPosts'),
      })
      .from(faces)
      .leftJoin(seeds, eq(seeds.faceId, faces.id))
      .$dynamic()
      .where(whereClause)
      .groupBy(
        faces.id,
        faces.userId,
        faces.name,
        faces.emoji,
        faces.description,
        faces.imageId,
        faces.visibility
      )
      .having(havingCondition)
      .orderBy(...orderByClauses)
      .limit(limit + 1); // hasNext 判定のため +1 件取得

    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;
    const nextCursor = hasNext ? items[items.length - 1].id : null;

    const faceEntitySummaries = items.map((row) =>
      makeSafeInfraResult(FaceEntitySummarySchema, {
        faceEntity: {
          id: row.id,
          userId: row.userId,
          name: row.name,
          emoji: row.emoji,
          description: row.description,
          imageId: row.imageId,
          visibility: row.visibility,
        },
        lastPostedAt: row.lastPostedAt ? row.lastPostedAt.toISOString() : null,
        numberOfPosts: row.numberOfPosts,
      })
    );

    return {
      faceEntitySummaries,
      nextCursor,
    };
  }

  async getFaceById(id: FaceId): Promise<FaceEntitySummary | null> {
    const row = await this.db
      .select({
        id: faces.id,
        userId: faces.userId,
        name: faces.name,
        emoji: faces.emoji,
        description: faces.description,
        imageId: faces.imageId,
        visibility: faces.visibility,
        lastPostedAt: max(seeds.createdAt).as('lastPostedAt'),
        numberOfPosts: count(seeds.id).as('numberOfPosts'),
      })
      .from(faces)
      .leftJoin(seeds, eq(seeds.faceId, faces.id))
      .$dynamic()
      .where(eq(faces.id, id))
      .groupBy(
        faces.id,
        faces.userId,
        faces.name,
        faces.emoji,
        faces.description,
        faces.imageId,
        faces.visibility
      );

    if (!row) {
      return null;
    }

    if (row.length === 0) {
      return null;
    }

    if (row.length > 1) {
      throw new InternalValidationError(`Multiple rows found for faceId ${id}`);
    }

    return makeSafeInfraResult(FaceEntitySummarySchema, {
      faceEntity: {
        id: row[0].id,
        userId: row[0].userId,
        name: row[0].name,
        emoji: row[0].emoji,
        description: row[0].description,
        imageId: row[0].imageId,
        visibility: row[0].visibility,
      },
      lastPostedAt: row[0].lastPostedAt ? row[0].lastPostedAt.toISOString() : null,
      numberOfPosts: row[0].numberOfPosts,
    });
  }
}

export function createDrizzleFaceQueryService(db: TracenDb): FaceQueryServiceSpec {
  return new DrizzleFaceQueryServiceImpl(db);
}
