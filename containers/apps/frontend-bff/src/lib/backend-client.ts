import 'server-only';

import { hc } from 'hono/client';
import type { AppType } from '@tracen/backend';

import { getServerEnv } from './env/server';

function createBackendClient() {
  return hc<AppType>(getServerEnv().APP_API_BASE_URL);
}

type BackendClient = ReturnType<typeof createBackendClient>;

let cached: BackendClient | undefined;

export function getBackendClient(): BackendClient {
  if (!cached) {
    cached = createBackendClient();
  }
  return cached;
}
