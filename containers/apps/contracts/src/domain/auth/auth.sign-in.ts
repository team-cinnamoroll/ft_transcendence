import { z } from 'zod';
import { AuthTokensDataSchema } from './auth.tokens';
import { UserInformationDataSchema } from '../user';
import { createApiResponseSchema } from '../../shared/response';

export const AuthSignInResponseSchema = createApiResponseSchema(
  z.object({ ...AuthTokensDataSchema.shape, ...UserInformationDataSchema.shape })
);

export type AuthSignInResponse = z.infer<typeof AuthSignInResponseSchema>;
