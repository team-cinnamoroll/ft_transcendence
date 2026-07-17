import { z } from 'zod';

import { UserInformationDataSchema } from './user.information';
import { createApiResponseSchema } from '../../shared/response';

export const UserMeResponseSchema = createApiResponseSchema(UserInformationDataSchema);
export type UserMeResponse = z.infer<typeof UserMeResponseSchema>;
