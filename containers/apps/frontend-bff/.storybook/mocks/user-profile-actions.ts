/**
 * @/server/actions/user-profile のモック。
 * Storybook 環境では 'use server' / next/cache が使えないため、
 * 本物の server/actions/user-profile.ts と同じ関数名・戻り値の形(ActionResult)を持つ偽実装で置き換える。
 */
import type { SimpleApi } from '../../src/types/api';
import type { ActionResult } from '../../src/server/actions/result';

export async function updateUserProfileAction(): Promise<ActionResult<SimpleApi>> {
  return { success: true, data: { success: true } };
}
