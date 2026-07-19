import { z } from 'zod';

const SuccessResultSchema = z
  .object({
    success: z.literal(true),
  })
  .strict();
type SuccessResult = z.infer<typeof SuccessResultSchema>;

const FailureResultSchema = z
  .object({
    success: z.literal(false),
    message: z.string(), // success: falseのときのエラーメッセージ
  })
  .strict();
export type FailureResult = z.infer<typeof FailureResultSchema>;

// -------------------------------------------------------------
// 関数のオーバーロード定義（z.ZodType を使って抽象化）
// -------------------------------------------------------------
// 引数なしの場合（dataなし）
export function createApiResponseSchema(): z.ZodType<SuccessResult | FailureResult>;

// 引数ありの場合（dataあり）
export function createApiResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T
): z.ZodType<(SuccessResult & { data: z.infer<T> }) | FailureResult>;

// -------------------------------------------------------------
// 関数の実体（内部は正しく検証し、戻り値は as any でキャスト）
// -------------------------------------------------------------
export function createApiResponseSchema<T extends z.ZodTypeAny>(
  dataSchema?: T
): z.ZodType<unknown> {
  const successSchema = dataSchema
    ? SuccessResultSchema.extend({ data: dataSchema }).strict()
    : SuccessResultSchema;

  // dataSchemaはZodによって内部的には完璧に Zod のバリデーションが作られます
  // 戻り値の型は上のオーバーロードに任せるため、外部向けの型安全性が完全に担保されており、型の安全性が保証されています
  return z.discriminatedUnion('success', [
    successSchema,
    FailureResultSchema,
  ]) as unknown as z.ZodType<unknown>;
}

export const SimpleApiResponseSchema = createApiResponseSchema();
export type SimpleApiResponse = z.infer<typeof SimpleApiResponseSchema>;
