import { sign } from 'hono/jwt';
import crypto from 'node:crypto';

import { AuthTokenWorkerSpec } from '../../domain/auth.worker';
import { JWTPayload } from '../../domain/auth.entity';

class HonoJWTAuthTokenWorker implements AuthTokenWorkerSpec {
  private secret: string;
  private privateJwk: crypto.JsonWebKey;

  constructor(secret: string) {
    this.secret = secret;
    this.privateJwk = crypto.createPrivateKey(this.secret).export({ format: 'jwk' });
  }

  async createJWT(payload: JWTPayload): Promise<string> {
    const privateJwk = this.privateJwk;
    const jwtToken = await sign(
      payload,
      { ...privateJwk, kid: 'key_v1', alg: 'RS256', use: 'sig' },
      'RS256'
    );
    return jwtToken;
  }
}

function createHonoJWTAuthTokenWorker(secret: string): AuthTokenWorkerSpec {
  return new HonoJWTAuthTokenWorker(secret);
}

export { createHonoJWTAuthTokenWorker };
