import { z } from 'zod';
import { AuthTokensDataSchema } from './auth.tokens';
import { UserInformationDataSchema } from '../user';
import { createApiResponseSchema } from '../../shared/response';

const AuthSignUpResponseDataSchema = z
  .object({ ...AuthTokensDataSchema.shape, ...UserInformationDataSchema.shape })
  .strict();

export const AuthSignUpResponseSchema = createApiResponseSchema(AuthSignUpResponseDataSchema);
export type AuthSignUpResponse = z.infer<typeof AuthSignUpResponseSchema>;
