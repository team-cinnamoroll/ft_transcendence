import { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { SimpleApiResponseSchema, type FailureResult } from '@tracen/contracts';
import { type AppEnv } from './shared/types/hono';

export const globalErrorHandler: ErrorHandler<AppEnv> = (err, c) => {
  // Honoが出す例外処理 (HTTPException)
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error(`[Unhandled Error]: ${err.stack || err.message}`);

  const isProduction = c.get('config')?.NODE_ENV === 'production';

  // 予期せぬエラー (500)
  console.error(err);
  return c.json(
    SimpleApiResponseSchema.parse({
      success: false,
      message: isProduction ? '予期せぬエラーが発生しました' : err.message,
    }),
    500
  );
};

export type GlobalErrorResponse = { 500: { json: FailureResult } };
