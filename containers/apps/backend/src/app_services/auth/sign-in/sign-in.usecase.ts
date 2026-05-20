import {
  type SignInRequest,
  type AuthSignInResponse,
  AuthSignInResponseSchema,
  UserResponseSchema,
} from '@tracen/contracts';
import type { UserRepositorySpec } from '../../../features/users/domain/users.repository';
import { type AuthPassWorkerSpec } from '../../../features/auth/domain/auth.worker';
import { getUserEntityByEmail } from '../../../features/users/domain/users.usecase';
import { ZodError } from 'zod';

export async function signIn(
  repo: UserRepositorySpec,
  worker: AuthPassWorkerSpec,
  request: SignInRequest
): Promise<AuthSignInResponse> {
  try {
    const user = await getUserEntityByEmail(repo, request.email);
    if (!user) {
      return AuthSignInResponseSchema.parse({
        success: false,
        message: 'invalid email or password',
        user: undefined,
      });
    }
    const passwordMatch = await worker.verifyPassword(request.password, user.password_hash);
    if (!passwordMatch) {
      return AuthSignInResponseSchema.parse({
        success: false,
        message: 'invalid email or password',
        user: undefined,
      });
    }
    return AuthSignInResponseSchema.parse({
      success: true,
      message: undefined,
      user: UserResponseSchema.parse({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      }),
    });
  } catch (err) {
    // ドメインエラーのみハンドリング
    if (err instanceof ZodError) {
      return AuthSignInResponseSchema.parse({
        success: false,
        message: 'invalid request data',
        user: undefined,
      });
    }
    // その他のエラーはthrowして、handler側で500エラーとしてハンドリング
    throw err;
  }
}
