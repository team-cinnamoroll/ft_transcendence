import { defineConfig } from 'drizzle-kit';

import { getDatabaseUrl } from './src/shared/infra/db/database-url';

const databaseUrl = getDatabaseUrl();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/features/**/infra/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
});
