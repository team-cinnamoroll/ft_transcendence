'use client';

import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { buildZodErrorMap } from './zod-error-map';

/**
 * `useForm` + `zodResolver` + `buildZodErrorMap` を組み合わせた共通カスタムフック。
 * 各フォームで重複していた「Zodスキーマをi18n対応のresolverに変換する」定型処理をまとめる。
 */
export function useZodForm<TFieldValues extends FieldValues>(
  schema: z.ZodType<TFieldValues, TFieldValues>,
  options?: Omit<UseFormProps<TFieldValues>, 'resolver'>
): UseFormReturn<TFieldValues> {
  const tValidation = useTranslations('validation');

  return useForm<TFieldValues>({
    resolver: zodResolver(schema, { error: buildZodErrorMap(tValidation) }),
    ...options,
  });
}
