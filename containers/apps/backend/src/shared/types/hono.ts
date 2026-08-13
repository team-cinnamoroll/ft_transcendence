import { RawEnv, Config } from '../../env';
import type { JWTPayload, ApiKey } from '../../features/auth/domain/auth.entity';

export type AppEnv = {
  Bindings: RawEnv;
  Variables: {
    config: Config;
  };
};

export type ProtectedEnv = AppEnv & {
  Variables: {
    jwtPayload: JWTPayload;
  };
};

export type ApiKeyEnv = AppEnv & {
  Variables: {
    apiKey: ApiKey;
  };
};
