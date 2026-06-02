import { JWTPayload } from '../domain/auth.entity';

export type AuthPassWorkerSpec = {
  createHash: (password: string) => Promise<string>;
  verifyPassword: (password: string, storedHash: string) => Promise<boolean>;
};

export type AuthAccessTokenWorkerSpec = {
  createJWT: (payload: JWTPayload) => Promise<string>;
};
