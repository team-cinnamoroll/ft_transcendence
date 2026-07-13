/**
 * @/server/actions/auth のモック。
 * Storybook 環境では 'use server' が使えないため、各 Action を偽実装で置き換える。
 */
import type { ActionResult } from '../../src/server/actions/result';

type MockAuthResult = { success: boolean; message?: string };

export async function signUpAction(): Promise<ActionResult<MockAuthResult>> {
  return { success: true, data: { success: true } };
}

export async function signInAction(): Promise<ActionResult<MockAuthResult>> {
  return { success: true, data: { success: true } };
}

export async function signOutAction(): Promise<ActionResult<void>> {
  return { success: true, data: undefined };
}
