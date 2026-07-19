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

/** サインアップ失敗時の errorKind を、i18n対応した表示文言に変換する */
function resolveSignUpErrorMessage(t: AuthMessageTranslator, errorKind: ApiErrorKind): string {
  if (errorKind === 'CONFLICT') {
    return t('errorEmailAlreadyExists');
  }
  return t('errorGeneric');
}

/** サインイン失敗時の errorKind を、i18n対応した表示文言に変換する */
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
