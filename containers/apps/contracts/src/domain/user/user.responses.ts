import { z } from 'zod';
import { UserSchema } from './user';
import { createApiResponseSchema } from '../../shared/response';

// UPDATE
export const UserUpdateResponseSchema = createApiResponseSchema(z.object({ user: UserSchema }));
export type UserUpdateResponse = z.infer<typeof UserUpdateResponseSchema>;

// DELETE は204 No Contentを返すので、レスポンスボディはなし

// GET (Single ID)
export const UserSingleIdResponseSchema = createApiResponseSchema(z.object({ user: UserSchema }));
export type UserSingleIdResponse = z.infer<typeof UserSingleIdResponseSchema>;
