import { SeedRepositorySpec } from '../seed.repository';
import { FileQueryServiceSpec } from '../../../../../core-domain/file/file.query-service';
import { type SeedId, type Seed } from '@tracen/contracts';
import { toSeed } from './seed.mapper';
import { NotFoundError } from '../../../../../shared/errors/global.error';

export async function fetchSeedById(
  repo: SeedRepositorySpec,
  fileQueryService: FileQueryServiceSpec,
  seedId: SeedId
): Promise<Seed> {
  try {
    const seedEntity = await repo.getSeedById(seedId);
    if (!seedEntity || seedEntity === null) {
      throw new NotFoundError(`Seed with ID ${seedId} not found`);
    }
    return toSeed(seedEntity, fileQueryService);
  } catch (error) {
    console.error('Error fetching seed by ID:', error);
    throw error;
  }
}
