import { SeedQueryServiceSpec } from '../seed.query-service';
import { FileQueryServiceSpec } from '../../../../../core-domain/file/file.query-service';
import { type QuerySeedRequest, type SeedList, SeedListSchema } from '@tracen/contracts';
import { toSeeds } from './seed.mapper';
import { makeSafeUsecaseResult } from '../../../../../shared/utils/validation';

export async function fetchSeedsByQuery(
  queryService: SeedQueryServiceSpec,
  fileQueryService: FileQueryServiceSpec,
  query: QuerySeedRequest
): Promise<SeedList> {
  try {
    const seedEntityList = await queryService.getSeedList(query);
    const seeds = await toSeeds(seedEntityList.seedEntities, fileQueryService);
    return makeSafeUsecaseResult(SeedListSchema, {
      seeds: seeds,
      nextCursor: seedEntityList.nextCursor,
    });
  } catch (error) {
    console.error('Error fetching seed list:', error);
    throw error;
  }
}
