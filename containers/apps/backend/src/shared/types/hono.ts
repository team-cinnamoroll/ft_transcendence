import { RawEnv, Config } from '../../env';

export type AppEnv = {
  Bindings: RawEnv;
  Variables: {
    config: Config;
  };
};
