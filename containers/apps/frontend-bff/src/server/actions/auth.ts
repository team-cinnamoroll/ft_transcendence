'use server';

import { z } from 'zod';
import { AuthSignUpRequestSchema, AuthSignInRequestSchema } from '@tracen/contracts';
import type { AuthSignUp, AuthSignIn } from '@/types/auth';
import {
  signUpAndStartSession,
  signInAndStartSession,
  signOutAndClearSession,
} from '@/server/usecases/auth';
import type { ActionResult } from './result';

export async function signUpAction(input: unknown): Promise<ActionResult<AuthSignUp>> {
  const parsed = AuthSignUpRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await signUpAndStartSession(parsed.data);

  return { success: true, data: result };
}

export async function signInAction(input: unknown): Promise<ActionResult<AuthSignIn>> {
  const parsed = AuthSignInRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await signInAndStartSession(parsed.data);

  return { success: true, data: result };
}

export async function signOutAction(): Promise<ActionResult<void>> {
  await signOutAndClearSession();

  return { success: true, data: undefined };
}
