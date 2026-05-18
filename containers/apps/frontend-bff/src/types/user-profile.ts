import { z } from 'zod';

import { UserProfileResponseSchema } from '@tracen/contracts';

export const UserProfileSchema = UserProfileResponseSchema.extend({});
export type UserProfile = z.infer<typeof UserProfileSchema>;
