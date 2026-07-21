'use server';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { AuthSignUpRequestSchema, AuthSignInRequestSchema } from '@tracen/contracts';
import type { AuthSignUp, AuthSignIn } from '@/types/auth';
import type { ApiErrorKind } from '@/lib/api-error';
import {
  signUpAndStartSession,
  signInAndStartSession,
  signOutAndClearSession,
} from '@/server/usecases/auth';
import { buildZodErrorMap } from '@/lib/zod-error-map';
import type { ActionResult } from './result';

type AuthMessageTranslator = Awaited<ReturnType<typeof getTranslations>>;

/**
 * サインアップ失敗時の errorKind を、i18n対応した表示文言に変換する。
 *
 * POST /auth/sign-up が実際に返しうる errorKind:
 * - VALIDATION(400): 通常発生しない（クライアント側でリクエスト前に検証済みのため）
 * - CONFLICT(409): メールアドレス／ユーザーが既に存在する
 * - SERVER_ERROR(500)/UNKNOWN: 予期しないエラー
 *
 * ユーザーが次に取るべき行動が変わるのは CONFLICT のみ（別のメールアドレスを使う）。
 * それ以外は「もう一度試す」以外に取れる行動が無いため、共通の errorGeneric にまとめる。
 */
function resolveSignUpErrorMessage(t: AuthMessageTranslator, errorKind: ApiErrorKind): string {
  if (errorKind === 'CONFLICT') {
    return t('errorEmailAlreadyExists');
  }
  return t('errorGeneric');
}

/**
 * サインイン失敗時の errorKind を、i18n対応した表示文言に変換する。
 *
 * POST /auth/sign-in が実際に返しうる errorKind:
 * - VALIDATION(400): 通常発生しない（クライアント側でリクエスト前に検証済みのため）
 * - UNAUTHORIZED(401): メールアドレス／パスワードが誤っている
 * - SERVER_ERROR(500)/UNKNOWN: 予期しないエラー
 *
 * ユーザーが次に取るべき行動が変わるのは UNAUTHORIZED のみ（パスワードを確認し直す）。
 * それ以外は「もう一度試す」以外に取れる行動が無いため、共通の errorUnexpected にまとめる。
 */
function resolveSignInErrorMessage(t: AuthMessageTranslator, errorKind: ApiErrorKind): string {
  if (errorKind === 'UNAUTHORIZED') {
    return t('errorGeneric');
  }
  return t('errorUnexpected');
}

export async function signUpAction(input: unknown): Promise<ActionResult<AuthSignUp>> {
  const t = await getTranslations('validation');
  const parsed = AuthSignUpRequestSchema.safeParse(input, { error: buildZodErrorMap(t) });
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await signUpAndStartSession(parsed.data);
  if (!result.success) {
    const tSignUp = await getTranslations('signUp');
    return {
      success: true,
      data: { success: false, message: resolveSignUpErrorMessage(tSignUp, result.errorKind) },
    };
  }

  return { success: true, data: { success: true, data: result.data } };
}

export async function signInAction(input: unknown): Promise<ActionResult<AuthSignIn>> {
  const t = await getTranslations('validation');
  const parsed = AuthSignInRequestSchema.safeParse(input, { error: buildZodErrorMap(t) });
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await signInAndStartSession(parsed.data);
  if (!result.success) {
    const tSignIn = await getTranslations('signIn');
    return {
      success: true,
      data: { success: false, message: resolveSignInErrorMessage(tSignIn, result.errorKind) },
    };
  }

  return { success: true, data: { success: true, data: result.data } };
}

export async function signOutAction(): Promise<ActionResult<void>> {
  await signOutAndClearSession();

  return { success: true, data: undefined };
}
