import { z } from 'zod';
import { InternalValidationError } from '../../shared/errors/global.error';

function createMakeSafeResult(errorMessage: string) {
  return <T>(schema: z.ZodType<T>, data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new InternalValidationError(errorMessage, result.error);
    }

    return result.data;
  };
}

// for ハンドラー
export const makeSafeResponse = createMakeSafeResult('Response validation failed');

// for ユースケース
export const makeSafeUsecaseResult = createMakeSafeResult('Usecase result validation failed');

// for インフラ
export const makeSafeInfraResult = createMakeSafeResult('Infra result validation failed');
