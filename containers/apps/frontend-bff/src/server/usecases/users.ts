import 'server-only';

import type { User } from '@/types/user';
import { getUserRepository } from '@/repositories/user-repository';

export async function getCurrentUser(): Promise<User> {
  return await getUserRepository().getCurrentUser();
}

export async function findUserById(userId: string): Promise<User | null> {
  return await getUserRepository().findById(userId);
}

export async function listAllUsers(): Promise<User[]> {
  return await getUserRepository().listAll();
}
