import type { MiddlewareHandler } from 'hono';

import type { Config } from '../../env';
import type { AppEnv } from '../types/hono';
import { parseEnv } from '../../env';

export function injectConfig(config: Config): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!config) {
      const conf = parseEnv(process.env);
      if (!conf) {
        return c.json({ message: 'Config is required' }, 500);
      }
      c.set('config', conf);
    } else {
      c.set('config', config);
    }

    await next();
  };
}
