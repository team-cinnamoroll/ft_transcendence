import { Context } from 'hono';
import { zValidator as honoZodValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { ZodType } from 'zod';
import { type AppEnv } from '../types/hono';
import { SimpleApiResponseSchema } from '@tracen/contracts';
import { makeSafeResponse } from './validation';

// カスタム zValidator ラッパー
export const customZValidator = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T
) => {
  return honoZodValidator(target, schema, (result, c) => {
    if (!result.success) {
      const context = c as unknown as Context<AppEnv>;
      const isProduction = context.get('config')?.NODE_ENV === 'production';
      console.error('zValidator error:', result.error);
      if (isProduction) {
        return c.json(
          makeSafeResponse(SimpleApiResponseSchema, {
            success: false,
            message: 'Invalid request data',
          }),
          400
        );
      } else {
        const formattedErrors = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return c.json(
          {
            success: false,
            message: 'Invalid request data',
            error: {
              code: 'INVALID_INPUT',
              details: formattedErrors,
            },
          },
          400
        );
      }
    }
  });
};
