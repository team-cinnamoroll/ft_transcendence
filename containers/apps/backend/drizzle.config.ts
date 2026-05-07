import { defineConfig } from 'drizzle-kit';

import { getDatabaseUrl } from './src/infra/db/database-url';

const databaseUrl = getDatabaseUrl();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infra/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
});
