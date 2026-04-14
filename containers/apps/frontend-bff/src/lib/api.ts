import { hc } from 'hono/client';
import type { AppType } from '@tracen/backend';

const baseUrl =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://backend:8000';

export const client = hc<AppType>(baseUrl);
