import { AuthPassWorkerSpec } from '../domain/auth.gateway';
import { createArgon2AuthPassWorker } from './worker/argon2-auth-pass.worker';

export function getAuthPassWorker(pepper: string): AuthPassWorkerSpec {
  return createArgon2AuthPassWorker(pepper);
}
