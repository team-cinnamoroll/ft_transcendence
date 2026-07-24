import { v4 as uuidv4 } from 'uuid';

import {
  type UserId,
  type UserNickname,
  type UserProfile,
  UserIdSchema,
  UserProfileSchema,
} from '@tracen/contracts';
import { type UserProfileRepositorySpec } from './user-profile.repository';
import { type FileQueryServiceSpec } from '../../../core-domain/file/file.query-service';
import { type UserProfileEntity, UserProfileEntitySchema } from './user-profile.entity';
import { ZodError } from 'zod';
import { ValidationError, InternalValidationError } from '../../../shared/errors/global.error';
import { makeSafeUsecaseResult } from '../../../shared/utils/validation';

export async function toUserProfile(
  profileEntity: UserProfileEntity,
  fileQueryService: FileQueryServiceSpec
): Promise<UserProfile> {
  if (profileEntity.avatarFileId) {
    const avatarFileMap = await fileQueryService.getFileUrlsByFileIds([profileEntity.avatarFileId]);
    const fileDto = avatarFileMap.get(profileEntity.avatarFileId) || null;
    if (!fileDto) {
      throw new InternalValidationError(
        `Avatar file with ID ${profileEntity.avatarFileId} not found for user profile ${profileEntity.userId}`
      );
    }
    return makeSafeUsecaseResult(UserProfileSchema, {
      id: profileEntity.userId,
      name: profileEntity.name,
      avatar: {
        id: fileDto.id,
        url: fileDto.url,
      },
      badge: profileEntity.badge,
    });
  }

  return makeSafeUsecaseResult(UserProfileSchema, {
    id: profileEntity.userId,
    name: profileEntity.name,
    avatar: null,
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
    const newProfileId = makeSafeUsecaseResult(UserIdSchema, uuidv4());
    const newProfileEntity = makeSafeUsecaseResult(UserProfileEntitySchema, {
      id: newProfileId,
      userId,
      name: userNickname,
      avatarFileId: null,
      badge: null,
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
