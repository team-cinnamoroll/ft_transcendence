import { v4 as uuidv4 } from 'uuid';

import {
  type UserId,
  type UserNickname,
  type UserProfile,
  UserProfileSchema,
} from '@tracen/contracts';
import { type UserProfileRepositorySpec } from './user-profile.repository';
import { type FileQueryServiceSpec } from '../../../core-domain/file/file.query-service';
import { type UserProfileEntity, UserProfileEntitySchema } from './user-profile.entity';
import { ZodError } from 'zod';
import { ValidationError } from '../../../shared/errors/global.error';

export async function toUserProfile(
  profileEntity: UserProfileEntity,
  fileQueryService: FileQueryServiceSpec
): Promise<UserProfile> {
  if (profileEntity.avatarFileId) {
    const avatarUrlsMap = await fileQueryService.getFileUrlsByFileIds([profileEntity.avatarFileId]);
    const avatarUrl = avatarUrlsMap.get(profileEntity.avatarFileId) || undefined;

    return UserProfileSchema.parse({
      id: profileEntity.userId,
      name: profileEntity.name,
      avatarUrl,
      badge: profileEntity.badge,
    });
  }

  return UserProfileSchema.parse({
    id: profileEntity.userId,
    name: profileEntity.name,
    avatarUrl: undefined,
    badge: profileEntity.badge,
  });
}

export async function createInitialUserProfile(
  userProfileRepo: UserProfileRepositorySpec,
  fileQueryService: FileQueryServiceSpec,
  userId: UserId,
  userNickname: UserNickname
): Promise<UserProfile> {
  try {
    const newProfileId = uuidv4();
    const newProfileEntity = UserProfileEntitySchema.parse({
      id: newProfileId,
      userId,
      name: userNickname,
      avatarFileId: undefined,
      badge: undefined,
    });

    await userProfileRepo.upsertUserProfile(newProfileEntity);
    const userProfile = await toUserProfile(newProfileEntity, fileQueryService);
    return userProfile;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(`Invalid user profile data: ${error.message}`);
    }
    console.error('Error creating initial user profile:', error);
    throw error;
  }
}
