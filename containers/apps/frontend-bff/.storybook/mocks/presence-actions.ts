/**
 * @/server/actions/presence のモック。
 * Storybook 環境では 'use server' が使えないため、各 Action を偽実装で置き換える。
 */
export async function heartbeatAction(): Promise<void> {
  return;
}

export async function refreshOnlineStatusesAction(
  userIds: string[]
): Promise<Record<string, boolean> | null> {
  return Object.fromEntries(userIds.map((id) => [id, false]));
}
