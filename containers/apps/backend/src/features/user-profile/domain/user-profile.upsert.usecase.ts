import { v4 as uuidv4 } from 'uuid';

import { UserId, UserProfileUpsertRequest } from '@tracen/contracts';
import { UserProfileRepositorySpec } from './user-profile.repository';
import { UserProfileEntity, UserProfileEntitySchema } from './user-profile.entity';

export async function upsertUserProfile(
  userProfileRepo: UserProfileRepositorySpec,
  userId: UserId,
  upsertRequest: UserProfileUpsertRequest
): Promise<{ userProfile: UserProfileEntity; isExisted: boolean }> {
  const newProfileId = uuidv4();
  const userProfile = UserProfileEntitySchema.parse({
    id: newProfileId,
    userId,
    ...upsertRequest,
  });
  try {
    const result = await userProfileRepo.upsertUserProfile(userProfile);
    if (result.id === newProfileId) {
      return { userProfile: result, isExisted: false };
    } else {
      return { userProfile: result, isExisted: true };
    }
  } catch (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
}
