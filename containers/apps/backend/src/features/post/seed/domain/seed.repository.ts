import type { SeedId, UserId } from '@tracen/contracts';
import { SeedEntity } from './seed.entity';

export type SeedRepositorySpec = {
  getSeedById: (seedId: SeedId) => Promise<SeedEntity | null>;
  getSeedsByIds: (seedIds: SeedId[]) => Promise<SeedEntity[]>;
  getSeedsByUserId: (userId: UserId) => Promise<SeedEntity[]>;

  createSeed: (seed: SeedEntity) => Promise<SeedEntity>;
  updateSeed: (seed: SeedEntity) => Promise<SeedEntity>;
  deleteSeedById: (seedId: SeedId) => Promise<void>;
};
