import type { QuerySeedRequest } from '@tracen/contracts';
import type { SeedEntityList } from './seed.entity';

export interface SeedQueryServiceSpec {
  getSeedList: (query: QuerySeedRequest) => Promise<SeedEntityList>;
}
