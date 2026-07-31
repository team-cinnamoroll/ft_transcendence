import { v4 as uuidv4 } from 'uuid';

import { UserId, UserProfileUpsertRequest } from '@tracen/contracts';
import { UserProfileRepositorySpec } from '../user-profile.repository';
import {
  UserProfileEntity,
  UserProfileEntitySchema,
  UserProfileIdSchema,
} from '../user-profile.entity';
import { makeSafeUsecaseResult } from '../../../../shared/utils/validation';
import { ValidationError } from '../../../../shared/errors/global.error';
import { ZodError } from 'zod';

export async function upsertUserProfile(
  userProfileRepo: UserProfileRepositorySpec,
  userId: UserId,
  upsertRequest: UserProfileUpsertRequest
): Promise<{ userProfile: UserProfileEntity; isExisted: boolean }> {
  const newProfileId = makeSafeUsecaseResult(UserProfileIdSchema, uuidv4());
  try {
    const userProfile = UserProfileEntitySchema.parse({
      id: newProfileId,
      userId,
      ...upsertRequest,
    });
    const result = await userProfileRepo.upsertUserProfile(userProfile);
    if (result.id === newProfileId) {
      return { userProfile: result, isExisted: false };
    } else {
      return { userProfile: result, isExisted: true };
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(`Invalid user profile data: ${error.message}`);
    }
    console.error('Error upserting user profile:', error);
    throw error;
  }
}
