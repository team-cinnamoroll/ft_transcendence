import { type UserId, type UserNickname, type UserProfile } from '@tracen/contracts';
import { type UserProfileRepositorySpec } from './user-profile.repository';
import { type FileQueryServiceSpec } from '../../../core-domain/file/file.query-service';
import { createInitialUserProfile, toUserProfile } from './user-profile.create-init.usecase';

export async function getOrCreateUserProfile(
  userProfileRepo: UserProfileRepositorySpec,
  fileQueryService: FileQueryServiceSpec,
  userId: UserId,
  userNickname: UserNickname
): Promise<{ userProfile: UserProfile; isExisted: boolean }> {
  const existingProfileEntity = await userProfileRepo.getUserProfile(userId);
  if (existingProfileEntity) {
    const userProfile = await toUserProfile(existingProfileEntity, fileQueryService);
    return { userProfile, isExisted: true };
  }

  const newInitialProfile = await createInitialUserProfile(
    userProfileRepo,
    fileQueryService,
    userId,
    userNickname
  );

  return { userProfile: newInitialProfile, isExisted: false };
}
