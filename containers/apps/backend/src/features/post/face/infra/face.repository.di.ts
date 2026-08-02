import type { FaceRepositorySpec } from '../domain/face.repository';
import { getDb } from '../../../../shared/infra/db/client';
import { createDrizzleFaceRepository } from './db/drizzle-face.repository.impl';

export function getFaceRepository(databaseUrl: string): FaceRepositorySpec {
  return createDrizzleFaceRepository(getDb(databaseUrl));
}
