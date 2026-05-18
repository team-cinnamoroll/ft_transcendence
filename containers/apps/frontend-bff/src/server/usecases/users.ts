import 'server-only';

import type { UserProfile } from '@/types/user-profile';
import { getUserRepository } from '@/repositories/user-repository';

export async function getCurrentUser(): Promise<UserProfile> {
  return await getUserRepository().getCurrentUser();
}

export async function findUserById(userId: string): Promise<UserProfile | null> {
  return await getUserRepository().findById(userId);
}

export async function listAllUsers(): Promise<UserProfile[]> {
  return await getUserRepository().listAll();
}
