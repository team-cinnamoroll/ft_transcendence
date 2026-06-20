import { RawEnv, Config } from '../../env';
import { JWTPayload } from '../../features/auth/domain/auth.entity';

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
