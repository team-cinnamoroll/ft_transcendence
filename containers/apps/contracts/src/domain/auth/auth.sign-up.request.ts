import { z } from 'zod';

import { UserCredentialsSchema } from '../user/user.request';

// サインアップリクエストスキーマと型
export const AuthSignUpRequestSchema = UserCredentialsSchema.strict();
export type AuthSignUpRequest = z.infer<typeof AuthSignUpRequestSchema>;
