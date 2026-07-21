import { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

import { InternalValidationError } from './shared/errors/global.error';
import { SimpleApiResponseSchema, type FailureResult } from '@tracen/contracts';
import { type AppEnv } from './shared/types/hono';

export const globalErrorHandler: ErrorHandler<AppEnv> = (err, c) => {
  // Honoが出す例外処理 (HTTPException)
  if (err instanceof HTTPException) {
    console.error(`from Hono[HTTPException]: ${err.stack || err.message}`);
    return err.getResponse();
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
