import { UserId, IsOnline } from '@tracen/contracts';
import { PresenceRepositorySpec } from './presence.repository';

export async function acceptHeartbeatRequest(
  repo: PresenceRepositorySpec,
  userId: UserId
): Promise<void> {
  await repo.setOnline(userId);
}

export async function acceptOfflineRequest(
  repo: PresenceRepositorySpec,
  userId: UserId
): Promise<void> {
  await repo.setOffline(userId);
}

export async function getOnlineStatuses(
  repo: PresenceRepositorySpec,
  userIds: UserId[]
): Promise<Record<UserId, IsOnline>> {
  return await repo.getOnlineStatuses(userIds);
}
