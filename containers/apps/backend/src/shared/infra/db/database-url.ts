const DEFAULT_DATABASE_URL = 'postgresql://tracen:tracen@db:5432/tracen';

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}
