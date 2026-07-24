import { UserId } from '@tracen/contracts';
import { UserProfileEntity } from './user-profile.entity';

export type UserProfileRepositorySpec = {
  upsertUserProfile: (userProfile: UserProfileEntity) => Promise<UserProfileEntity>;
  getUserProfile: (userId: UserId) => Promise<UserProfileEntity | null>;
  getUserProfiles: (userIds: UserId[]) => Promise<UserProfileEntity[]>;
};
