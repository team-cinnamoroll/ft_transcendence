import { AuthPassWorkerSpec } from '../domain/auth.worker';
import { createArgon2AuthPassWorker } from './worker/argon2-auth-pass.worker.impl';

export function getAuthPassWorker(pepper: string): AuthPassWorkerSpec {
  return createArgon2AuthPassWorker(pepper);
}
