import { z } from 'zod';
import { UserSchema } from './user';
import { UserProfileSchema } from './user-profile';

export const UserInformationDataSchema = z
  .object({
    user: UserSchema,
    userProfile: UserProfileSchema,
  })
  .strict();
export type UserInformationData = z.infer<typeof UserInformationDataSchema>;
