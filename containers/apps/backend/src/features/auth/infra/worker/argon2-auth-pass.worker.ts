import * as argon2 from 'argon2';
import { AuthPassWorkerSpec } from '../../domain/auth.gateway';

class AuthPassWorkerImpl implements AuthPassWorkerSpec {
  constructor(private readonly pepper: string) {}

  async createHash(password: string): Promise<string> {
    const hash = await argon2.hash(password + this.pepper, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64MB
      timeCost: 3, // 3イテレーション
    });
    return hash;
  }

  async verifyPassword(password: string): Promise<boolean> {
    const hash = await this.createHash(password);
    const isValid = await argon2.verify(hash, password + this.pepper);
    return isValid;
  }
}

function createArgon2AuthPassWorker(pepper: string): AuthPassWorkerSpec {
  return new AuthPassWorkerImpl(pepper);
}

export { createArgon2AuthPassWorker };
