import { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

import {
  ValidationError,
  InternalValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from './shared/errors/global.error';
import { SimpleApiResponseSchema, type FailureResult } from '@tracen/contracts';
import { type AppEnv } from './shared/types/hono';

export const globalErrorHandler: ErrorHandler<AppEnv> = (err, c) => {
  // Honoが出す例外処理 (HTTPException) — JSON形式で返す
  if (err instanceof HTTPException) {
    console.error(`from Hono[HTTPException]: ${err.stack || err.message}`);
    return c.json(
      SimpleApiResponseSchema.parse({ success: false, message: err.message }),
      err.status
    );
  }

  if (err instanceof NotFoundError) {
    console.error(`from NotFoundError: ${err.stack || err.message}`);
    return c.json(SimpleApiResponseSchema.parse({ success: false, message: err.message }), 404);
  }

  if (err instanceof UnauthorizedError) {
    console.error(`from UnauthorizedError: ${err.stack || err.message}`);
    return c.json(SimpleApiResponseSchema.parse({ success: false, message: err.message }), 401);
  }

  if (err instanceof ForbiddenError) {
    console.error(`from ForbiddenError: ${err.stack || err.message}`);
    return c.json(SimpleApiResponseSchema.parse({ success: false, message: err.message }), 403);
  }

  if (err instanceof ValidationError) {
    // バリデーションエラー (400)
    console.error(`from ValidationError: ${err.stack || err.message}`);
    return c.json(SimpleApiResponseSchema.parse({ success: false, message: err.message }), 400);
  }

  if (err instanceof ZodError) {
    // バリデーションエラー (400)
    console.error(`from ZodError: ${err.stack || err.message}`);
    return c.json(
      SimpleApiResponseSchema.parse({ success: false, message: 'Invalid request data' }),
      400
    );
  }

  if (err instanceof InternalValidationError) {
    // バックエンド内でレスポンス生成時に発生したZodによるバリデーションエラー
    return c.json(
      SimpleApiResponseSchema.parse({ success: false, message: 'Failed to make response' }),
      500
    );
  }

  console.error(`[Unhandled Error]: ${err.stack || err.message}`);

  const isProduction = c.get('config')?.NODE_ENV === 'production';

  // 予期せぬエラー (500)
  console.error(err);
  return c.json(
    SimpleApiResponseSchema.parse({
      success: false,
      message: isProduction ? 'Unhandled error occurred.' : err.message,
    }),
    500
  );
};

export type GlobalErrorResponse = { 500: { json: FailureResult }; 400: { json: FailureResult } };
