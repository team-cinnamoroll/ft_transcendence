import { AuthPassWorkerSpec } from '../domain/auth.worker';
import { createArgon2AuthPassWorker } from './worker/argon2-auth-pass.worker.impl';
import { AuthAccessTokenWorkerSpec } from '../domain/auth.worker';
import { createHonoJWTAuthTokenWorker } from './worker/hono-jwt-auth-token.worker.impl';

export function getAuthPassWorker(pepper: string): AuthPassWorkerSpec {
  return createArgon2AuthPassWorker(pepper);
}

export function getAuthAccessTokenWorker(jwtSecret: string): AuthAccessTokenWorkerSpec {
  return createHonoJWTAuthTokenWorker(jwtSecret);
}
