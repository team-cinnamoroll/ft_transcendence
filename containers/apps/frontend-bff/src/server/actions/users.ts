'use server';

import { revalidatePath } from 'next/cache';

import type { UpdateProfileInput } from '@/repositories/user-repository';
import { updateCurrentUserProfile } from '@/server/usecases/users';

export async function updateProfileAction(input: UpdateProfileInput) {
  const profile = await updateCurrentUserProfile(input);

  revalidatePath('/');

  return profile;
}
