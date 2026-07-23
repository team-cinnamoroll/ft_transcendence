import type { MiddlewareHandler } from 'hono';

import type { Config } from '../../env';
import type { AppEnv } from '../types/hono';
import { parseEnv } from '../../env';
import { makeSafeResponse } from '../utils/validation';
import { SimpleApiResponseSchema } from '@tracen/contracts';

export function injectConfig(config?: Config): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!config) {
      const conf = parseEnv(process.env);
      if (!conf) {
        return c.json(
          makeSafeResponse(SimpleApiResponseSchema, {
            success: false,
            message: 'Service Initialization error',
          }),
          500
        );
      }
      c.set('config', conf);
    } else {
      c.set('config', config);
    }

    await next();
  };
}
