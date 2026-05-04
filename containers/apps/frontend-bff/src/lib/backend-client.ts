import 'server-only';

import { hc } from 'hono/client';
import type { AppType } from '@tracen/backend';

import { getServerEnv } from './env/server';

function createBackendClient() {
  const env = getServerEnv();
  const apiUrl = env.APP_API_BASE_URL + env.APP_API_BASE_PATH;
  return hc<AppType>(apiUrl);
}

type BackendClient = ReturnType<typeof createBackendClient>;

let cached: BackendClient | undefined;

export function getBackendClient(): BackendClient {
  if (!cached) {
    cached = createBackendClient();
  }
  return cached;
}
