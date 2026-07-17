import type { MiddlewareHandler } from 'hono';

import { AppEnv } from '../../shared/types/hono';
import { FileQueryServiceSpec } from '../../core-domain/file/file.query-service';
import { createDrizzleFileQueryService } from './infra/db/drizzle-file.query-service.impl';

import { getDb } from '../../shared/infra/db/client';
import { getFileUrlGenerator } from './infra/file-storage.repository.di';

function getFileQueryService(databaseUrl: string): FileQueryServiceSpec {
  const db = getDb(databaseUrl);
  const fileUrlGenerator = getFileUrlGenerator();
  return createDrizzleFileQueryService(db, fileUrlGenerator);
}

export type FileQueryHandlerEnv = AppEnv & {
  Variables: {
    fileQueryService: FileQueryServiceSpec;
  };
};

export function injectFileQueryDeps(): MiddlewareHandler<FileQueryHandlerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json({ message: 'Config is required' }, 500);
    }
    const fileQueryService = getFileQueryService(config.DATABASE_URL);
    if (!fileQueryService) {
      return c.json({ message: 'File query service is not initialized' }, 500);
    }
    c.set('fileQueryService', fileQueryService);
    await next();
  };
}
