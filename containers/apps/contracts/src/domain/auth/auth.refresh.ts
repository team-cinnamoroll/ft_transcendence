import { z } from 'zod';
import { AuthTokensDataSchema } from './auth.tokens';
import { createApiResponseSchema } from '../../shared/response';

export const AuthRefreshResponseSchema = createApiResponseSchema(AuthTokensDataSchema);
export type AuthRefreshResponse = z.infer<typeof AuthRefreshResponseSchema>;
